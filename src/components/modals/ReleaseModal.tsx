import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Button,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardMedia,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Release } from '../../types/release';
import { Artist } from '../../types/artist';
import { useNavigate } from 'react-router-dom';

interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  release: Release;
}

interface ArtistPreviewProps {
  artist: Artist;
}

const ArtistPreview: React.FC<ArtistPreviewProps> = ({ artist }) => {
  const navigate = useNavigate();
  
  // Get the best available image URL
  const getArtistImage = (artist: any): string => {
    // Check all possible image URL fields in order of preference
    return artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url ||
           (artist.images && artist.images[0]?.url) ||
           '/images/placeholder-artist.jpg';
  };
  
  const handleArtistClick = () => {
    console.log('Navigating to artist:', artist.id);
    navigate(`/artists/${artist.id}`);
  };

  return (
    <Card 
      onClick={handleArtistClick} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'row',
        alignItems: 'center', 
        mb: 2, 
        borderRadius: 2,
        cursor: 'pointer',
        padding: 1,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      <Avatar
        src={getArtistImage(artist)}
        alt={artist.name}
        sx={{ 
          width: 50, 
          height: 50, 
          mr: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      />
      <Typography variant="subtitle1">{artist.name}</Typography>
    </Card>
  );
};

export const ReleaseModal = ({ open, onClose, release }: ReleaseModalProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const formatDuration = (ms: number | undefined): string => {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleArtistClick = (artist: Artist) => {
    navigate(`/artists/${artist.id}`);
  };

  // Log the release for debugging
  console.log('Rendering ReleaseModal with release:', release);
  console.log('Artists in release:', release.artists);
  console.log('Artists array type:', Array.isArray(release.artists));
  console.log('Artists array length:', release.artists?.length);
  
  // Ensure we have an artists array
  let artists = release.artists || [];
  let hasArtists = Array.isArray(artists) && artists.length > 0;
  
  // Check if tracks have artist information we can use
  if (!hasArtists && release.tracks && release.tracks.length > 0) {
    console.log('Trying to extract artists from tracks');
    
    // Create a map to avoid duplicates
    const artistMap = new Map();
    
    release.tracks.forEach(track => {
      if (track.artists && Array.isArray(track.artists)) {
        track.artists.forEach(artist => {
          if (artist && artist.id && !artistMap.has(artist.id)) {
            artistMap.set(artist.id, artist);
          }
        });
      }
    });
    
    if (artistMap.size > 0) {
      console.log('Found artists in tracks:', artistMap.size);
      artists = Array.from(artistMap.values());
      hasArtists = true;
    }
  }
  
  // Create default artist if none exists
  // This is a temporary solution to handle missing data
  if (!hasArtists) {
    console.log('Creating default artist for release:', release.title);
    
    // Try to extract artist name and image from release data
    let artistName = 'Unknown Artist';
    let artistImageUrl = 'https://via.placeholder.com/50?text=Artist';
    
    // Check if we have any artist information from tracks
    if (release.tracks && release.tracks.length > 0) {
      const trackWithArtist = release.tracks.find(track => 
        track.artists && track.artists.length > 0 && track.artists[0].name);
      
      if (trackWithArtist && trackWithArtist.artists && trackWithArtist.artists.length > 0) {
        const artist = trackWithArtist.artists[0];
        artistName = artist.name || artistName;
        artistImageUrl = getTrackArtistImage(artist);
      }
    }
    
    const defaultArtist = {
      id: 'unknown',
      name: artistName,
      uri: '',
      type: 'artist',
      profile_image_url: artistImageUrl
    };
    
    artists = [defaultArtist];
    hasArtists = true;
  }

  // Helper function to get the best available image URL for an artist
  const getArtistImage = (artist: any): string => {
    // Check all possible image URL fields in order of preference
    return artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url ||
           (artist.images && artist.images[0]?.url) ||
           '/images/placeholder-artist.jpg';
  };

  const getTrackArtistImage = (artist: any): string => {
    return artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url || 
           (artist.images && artist.images[0]?.url) || 
           '/images/placeholder-artist.jpg';
  };

  const [state, setState] = React.useState({});

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="div">
            {release.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Release Info */}
          <Grid item xs={12} md={4}>
            <Box
              component="img"
              src={release.artwork_url || '/default-album.png'}
              alt={release.title}
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 2,
                mb: 2,
                aspectRatio: '1/1',
                objectFit: 'cover'
              }}
            />
            <Typography variant="h6" gutterBottom>
              {release.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {hasArtists ? (
                artists.map((artist, i) => (
                  <Box 
                    component="span" 
                    key={artist.id} 
                    sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      mr: 1 
                    }}
                  >
                    <Avatar
                      src={getArtistImage(artist)}
                      alt={artist.name}
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 0.5,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleArtistClick(artist)}
                    />
                    <Box 
                      component="span" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => handleArtistClick(artist)}
                    >
                      {artist.name}
                    </Box>
                    {i < (artists.length || 0) - 1 && ", "}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No artist information available
                </Typography>
              )}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Artists
            </Typography>
            <Box>
              {hasArtists ? (
                artists.map((artist) => (
                  <ArtistPreview
                    key={artist.id}
                    artist={artist}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No artist information available
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Release Date: {new Date(release.release_date).toLocaleDateString()}
            </Typography>
            {release.spotify_url && (
              <Link
                href={release.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'inline-block', mt: 1 }}
              >
                Listen on Spotify
              </Link>
            )}
          </Grid>

          {/* Tracks Table */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Tracks
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Artists</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Preview</TableCell>
                    <TableCell>Links</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {release?.tracks?.length > 0 ? (
                    release.tracks.map((track, index) => {
                      // Check if the track is a remix
                      const isRemix = track.title?.includes(' - ') && track.title?.toLowerCase().endsWith('remix');
                      let remixArtist = '';

                      if (isRemix) {
                        const parts = track.title.split(' - ');
                        remixArtist = parts[parts.length - 1].replace(' Remix', '');
                      }

                      return (
                        <TableRow key={track.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{track.title}</TableCell>
                          <TableCell>
                            {track.artists?.map((artist, i) => (
                              <Box 
                                component="span" 
                                key={artist.id} 
                                sx={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center',
                                  mr: 0.5 
                                }}
                              >
                                <Avatar
                                  src={getTrackArtistImage(artist)}
                                  alt={artist.name}
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    mr: 0.5,
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArtistClick(artist);
                                  }}
                                />
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArtistClick(artist);
                                  }}
                                >
                                  {artist.name}
                                </Box>
                                {i < (track.artists?.length || 0) - 1 && ", "}
                              </Box>
                            ))}
                            {isRemix && remixArtist && ` (${remixArtist} Remix)`}
                          </TableCell>
                          <TableCell>{track.duration ? formatDuration(track.duration) : '--:--'}</TableCell>
                          <TableCell>
                            {track.preview_url && (
                              <audio controls>
                                <source src={track.preview_url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            )}
                          </TableCell>
                          <TableCell>
                            {track.spotify_url && (
                              <Link
                                href={track.spotify_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                              >
                                Spotify
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No tracks available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
