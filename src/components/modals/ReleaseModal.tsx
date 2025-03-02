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
  Avatar,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Release } from '../../types/release';
import { Artist } from '../../types/artist';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  release: Release;
  onArtistClick?: (artist: Artist) => void;
}

interface ArtistPreviewProps {
  artist: Artist;
  onArtistClick?: (artist: Artist) => void;
}

const ArtistPreview: React.FC<ArtistPreviewProps> = ({ artist, onArtistClick }) => {
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
    if (onArtistClick) {
      onArtistClick(artist);
    } else {
      console.log('Navigating to artist:', artist.id);
      navigate(`/artists/${artist.id}`);
    }
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

export const ReleaseModal = ({ open, onClose, release, onArtistClick }: ReleaseModalProps) => {
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
    if (onArtistClick) {
      onArtistClick(artist);
    } else {
      navigate(`/artists/${artist.id}`);
    }
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
    
    // Check if this is likely a compilation
    const isCompilation = release.title?.toLowerCase().includes('compilation') || 
                         release.title?.toLowerCase().includes('various') ||
                         (release.tracks && release.tracks.length > 2 && 
                          new Set(release.tracks.flatMap(t => t.artists?.map(a => a.id) || [])).size > 3);
    
    // Try to extract artist name and image from release data
    let artistName = isCompilation ? 'Various Artists' : 'Unknown Artist';
    
    // For compilations or Various Artists, use the album artwork
    let artistImageUrl = isCompilation && release.artwork_url 
      ? release.artwork_url 
      : '/images/placeholder-artist.jpg';
    
    // Check if we have any artist information from tracks
    if (!isCompilation && release.tracks && release.tracks.length > 0) {
      const trackWithArtist = release.tracks.find(track => 
        track.artists && track.artists.length > 0 && track.artists[0].name);
      
      if (trackWithArtist && trackWithArtist.artists && trackWithArtist.artists.length > 0) {
        const artist = trackWithArtist.artists[0];
        artistName = artist.name || artistName;
        artistImageUrl = getTrackArtistImage(artist);
      }
    }
    
    const defaultArtist = {
      id: isCompilation ? 'various-artists' : 'unknown',
      name: artistName,
      uri: '',
      type: 'artist',
      profile_image_url: artistImageUrl
    };
    
    artists = [defaultArtist];
    hasArtists = true;
  } else {
    // Check if this might be a Various Artists compilation
    const isCompilation = release.title?.toLowerCase().includes('compilation') ||
                         release.title?.toLowerCase().includes('various') ||
                         (artists.length === 1 && artists[0].name === "Various Artists") ||
                         (release.tracks && release.tracks.length > 2 && 
                          new Set(release.tracks.flatMap(t => t.artists?.map(a => a.id) || [])).size > 3);
    
    if (isCompilation && artists.length === 1 && artists[0].name === "Various Artists") {
      // Update the Various Artists image to use the album artwork
      artists[0].profile_image_url = release.artwork_url || artists[0].profile_image_url;
    }
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
      aria-labelledby="release-modal-title"
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#000000',
          borderRadius: 2,
        }
      }}
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
                    onArtistClick={onArtistClick}
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
                    <TableCell align="center">Play</TableCell>
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
                          <TableCell align="center">
                            {track.spotify_url || track.external_urls?.spotify ? (
                              <Tooltip title="Play on Spotify">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => window.open(track.spotify_url || track.external_urls?.spotify, '_blank')}
                                >
                                  <PlayArrowIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
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
