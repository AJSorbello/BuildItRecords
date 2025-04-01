import React, { useState, useEffect, useMemo } from 'react';
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
  TableCellProps,
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Release } from '../../types/release';
import { Track } from '../../types/track';
import { Artist, SpotifyExternalUrls } from '../../types/index';
import { useNavigate } from 'react-router-dom';

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

const ArtistPreview: React.FC<ArtistPreviewProps> = ({ artist, onArtistClick }) => {
  const navigate = useNavigate();
  
  const handleArtistClick = () => {
    if (onArtistClick) {
      onArtistClick(artist);
    } else {
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
  const [processedArtists, setProcessedArtists] = useState<Artist[]>([]);
  const [hasArtists, setHasArtists] = useState(false);

  // Process artists data when release changes or modal opens
  useEffect(() => {
    if (!release) return;
    
    // Ensure we have an artists array
    let artists = release.artists || [];
    let artistsFound = Array.isArray(artists) && artists.length > 0;
    
    // Debug the release data to understand what's available
    console.log('[ReleaseModal] Release data in modal:', {
      id: release.id,
      title: release.title,
      artists: release.artists,
      tracks: release.tracks,
      hasArtists: artistsFound,
      trackCount: release.tracks?.length || 0,
      fullRelease: release // Log the full release object to inspect all properties
    });
    
    // If tracks are missing, try to fetch them
    if (!release.tracks || release.tracks.length === 0) {
      // We need to ensure we have tracks data
      console.error('[ReleaseModal] No tracks found in release data. This is likely an API issue.');
      console.error('[ReleaseModal] Check that the API is returning tracks with the release data.');
      console.error('[ReleaseModal] API request should include include_tracks=true parameter.');
      
      // Try to access tracks from other properties that might exist
      if ((release as any).album && (release as any).album.tracks && (release as any).album.tracks.length > 0) {
        console.log('[ReleaseModal] Found tracks in release.album.tracks:', (release as any).album.tracks.length);
        // Use type assertion to handle dynamic properties
        release.tracks = (release as any).album.tracks;
      }
    }
    
    setProcessedArtists(artists);
    setHasArtists(artistsFound);
  }, [release, open]);

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

  if (!release) return null;

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
          backgroundColor: theme.palette.background.paper,
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
                processedArtists.map((artist, i) => (
                  <Box 
                    component="span" 
                    key={artist.id || `artist-${i}`} 
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
                    {i < (processedArtists.length || 0) - 1 && ", "}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Unknown Artist
                </Typography>
              )}
            </Typography>
            <Box>
              {hasArtists ? (
                processedArtists.map((artist) => (
                  <ArtistPreview
                    key={artist.id}
                    artist={artist}
                    onArtistClick={onArtistClick}
                  />
                ))
              ) : null}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <strong>Release Date:</strong> {new Date(release.release_date).toLocaleDateString()}
                </Box>
                {release.catalog_number && (
                  <Box>
                    <strong>Catalog Number:</strong> {release.catalog_number}
                  </Box>
                )}
                {release.label && (
                  <Box>
                    <strong>Label:</strong> {
                      typeof release.label === 'object' && release.label && 'name' in release.label 
                        ? (release.label as any).name 
                        : typeof release.label === 'string' 
                          ? release.label 
                          : release.label_id || 'Unknown Label'
                    }
                  </Box>
                )}
                {release.type && (
                  <Box>
                    <strong>Type:</strong> {release.type.charAt(0).toUpperCase() + release.type.slice(1)}
                  </Box>
                )}
              </Box>
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

          {/* Tracks */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Tracks
              </Typography>
              {release.spotify_url && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  href={release.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Listen on Spotify
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, borderRadius: 2 }}>
              <Table stickyHeader aria-label="track listing table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50 }}>#</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Artists</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell align="right" sx={{ width: 70 }}>Play</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {release.tracks && release.tracks.length > 0 ? (
                    release.tracks.map((track, index) => {
                      // Check if this is a remix
                      const isRemix = track.title?.toLowerCase().includes('remix') || false;
                      // Get remixer info if available
                      const remixer = (track as any).remixer || (isRemix && track.artists && track.artists.length > 1 ? track.artists[track.artists.length - 1] : null);
                      
                      return (
                        <TableRow key={track.id || `track-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {track.title || (track as any).name || `Track ${index + 1}`}
                              {isRemix && !track.title?.toLowerCase().includes('remix') && ' (Remix)'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {track.artists && track.artists.length > 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {/* Main Artists */}
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {track.artists.map((artist, i) => (
                                    <Box 
                                      key={artist.id || `artist-${i}`} 
                                      sx={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center',
                                        mr: i < track.artists.length - 1 ? 1 : 0,
                                        mb: 0.5
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
                                        onClick={() => handleArtistClick(artist)}
                                      />
                                      <Link 
                                        component="button" 
                                        variant="caption" 
                                        color="inherit" 
                                        onClick={() => handleArtistClick(artist)}
                                        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                      >
                                        {artist.name}
                                      </Link>
                                      {i < track.artists.length - 1 && ", "}
                                    </Box>
                                  ))}
                                </Box>
                                
                                {/* Remixer if available */}
                                {remixer && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                                      Remix by:
                                    </Typography>
                                    <Box 
                                      sx={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Avatar
                                        src={getTrackArtistImage(remixer)}
                                        alt={remixer.name}
                                        sx={{
                                          width: 20,
                                          height: 20,
                                          mr: 0.5,
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => handleArtistClick(remixer)}
                                      />
                                      <Link 
                                        component="button" 
                                        variant="caption" 
                                        color="inherit" 
                                        onClick={() => handleArtistClick(remixer)}
                                        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                      >
                                        {remixer.name}
                                      </Link>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No artist information
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {formatDuration(track.duration_ms || (track as any).duration || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {(track.preview_url || track.spotifyUrl || 
                              (track.external_urls && track.external_urls.spotify)) && (
                              <IconButton 
                                size="small" 
                                color="primary"
                                href={track.preview_url || track.spotifyUrl || track.external_urls?.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell align="center" sx={{ colSpan: 5 }}>
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
