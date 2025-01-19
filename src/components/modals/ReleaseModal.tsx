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
  CardMedia
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Release } from '../../types/release';
import { Artist } from '../../types/artist';
import { useNavigate } from 'react-router-dom';

interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  release: Release | null;
}

const ArtistPreview: React.FC<{ artist: Artist }> = ({ artist }) => {
  const navigate = useNavigate();
  
  const handleArtistClick = () => {
    navigate(`/artists/${artist.id}`);
  };

  return (
    <Card sx={{ cursor: 'pointer', mb: 1 }} onClick={handleArtistClick}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
        <CardMedia
          component="img"
          sx={{ width: 50, height: 50, borderRadius: 1, mr: 2 }}
          image={artist.image_url || '/default-artist.png'}
          alt={artist.name}
        />
        <CardContent sx={{ flex: '1 1 auto', py: 1, '&:last-child': { pb: 1 } }}>
          <Typography variant="subtitle1">{artist.name}</Typography>
        </CardContent>
      </Box>
    </Card>
  );
};

const ReleaseModal: React.FC<ReleaseModalProps> = ({ open, onClose, release }) => {
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

  if (!release) return null;

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
            {release.name}
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
              alt={release.name}
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
              {release.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {release.artists?.map(artist => artist.name).join(', ')}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Artists
            </Typography>
            <Box>
              {release.artists?.map((artist) => (
                <ArtistPreview
                  key={artist.id}
                  artist={artist}
                />
              ))}
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
                  {release.tracks?.map((track, index) => {
                    // Get original artists from the track or release
                    const originalArtists = track.artists || release.artists || [];
                    
                    // Check if track name contains " - " and ends with "Remix"
                    const isRemix = track.name.includes(' - ') && track.name.toLowerCase().endsWith('remix');
                    let remixerName = '';
                    
                    if (isRemix) {
                      // Extract remixer name from track name (e.g., "Track - Artist Remix" -> "Artist")
                      const parts = track.name.split(' - ');
                      if (parts.length > 1) {
                        remixerName = parts[1].replace(/ Remix$/i, '');
                      }
                    }

                    return (
                      <TableRow key={track.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{track.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Show original artists only if not a remix */}
                            {!isRemix && (
                              <Box>
                                {originalArtists.map((artist, artistIndex) => (
                                  <React.Fragment key={artist.id || artistIndex}>
                                    <Button
                                      onClick={() => handleArtistClick(artist)}
                                      sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                                      color="primary"
                                    >
                                      {artist.name}
                                    </Button>
                                    {artistIndex < originalArtists.length - 1 ? ', ' : ''}
                                  </React.Fragment>
                                ))}
                              </Box>
                            )}
                            
                            {/* Show remixer if it's a remix */}
                            {isRemix && (
                              <Box sx={{ color: 'text.secondary' }}>
                                <Typography variant="body2" component="span">
                                  Remix by{' '}
                                </Typography>
                                {track.remixer ? (
                                  <Button
                                    onClick={() => handleArtistClick(track.remixer)}
                                    sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                                    color="primary"
                                  >
                                    {track.remixer.name}
                                  </Button>
                                ) : (
                                  <Typography variant="body2" component="span" sx={{ color: 'primary.main' }}>
                                    {remixerName}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {track.duration ? formatDuration(track.duration) : '--:--'}
                        </TableCell>
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
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseModal;
