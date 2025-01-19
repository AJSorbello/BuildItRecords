import React, { useEffect, useState } from 'react';
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
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Track } from '../../types/track';
import { Artist } from '../../types/artist';
import { databaseService } from '../../services/DatabaseService';
import { RECORD_LABELS } from '../../constants/labels';

interface ArtistModalProps {
  open: boolean;
  onClose: () => void;
  artist: Artist | null;
}

const ArtistModal: React.FC<ArtistModalProps> = ({ open, onClose, artist }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchTracks = async () => {
      if (!artist?.id) return;
      
      setLoading(true);
      try {
        const artistTracks = await databaseService.getTracksByArtist(artist.id);
        setTracks(artistTracks);
      } catch (error) {
        console.error('Error fetching artist tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && artist) {
      fetchTracks();
    }
  }, [open, artist]);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const formatLabelName = (labelId: string): string => {
    const label = Object.values(RECORD_LABELS).find(l => l.id === labelId);
    return label ? label.displayName : labelId.replace('buildit-', 'Build It ').replace(/^\w/, c => c.toUpperCase());
  };

  if (!artist) return null;

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
            {artist.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Artist Info */}
          <Grid item xs={12} md={4}>
            <Box
              component="img"
              src={artist.images?.[0]?.url || '/placeholder-artist.jpg'}
              alt={artist.name}
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 2,
                mb: 2,
                aspectRatio: '1/1',
                objectFit: 'cover'
              }}
            />
            {artist.external_urls?.spotify && (
              <Box mb={2}>
                <Link
                  href={artist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                >
                  View on Spotify
                </Link>
              </Box>
            )}
            {artist.genres && artist.genres.length > 0 && (
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  Genres
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {artist.genres.join(', ')}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Tracks Table */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Tracks
            </Typography>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading tracks...</Typography>
              </Box>
            ) : tracks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No tracks found</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Artwork</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Release Date</TableCell>
                      <TableCell>Label</TableCell>
                      <TableCell>Links</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tracks.map((track) => (
                      <TableRow key={track.id} hover>
                        <TableCell>
                          <Box
                            component="img"
                            src={track.artwork_url || '/placeholder.png'}
                            alt={track.title}
                            sx={{
                              width: 50,
                              height: 50,
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{track.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {track.artists?.map(a => a.name).join(', ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDuration(track.duration_ms)}
                        </TableCell>
                        <TableCell>
                          {new Date(track.release_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {formatLabelName(track.label)}
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistModal;
