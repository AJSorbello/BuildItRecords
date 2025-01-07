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
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Track } from '../../types/Track';
import { Artist } from '../../types/Artist';
import { databaseService } from '../../services/DatabaseService';

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
            {artist.profile_image && (
              <Box
                component="img"
                src={artist.profile_image}
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
            )}
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {artist.bio || 'No biography available'}
            </Typography>
          </Grid>

          {/* Tracks Table */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Tracks
            </Typography>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading tracks...</Typography>
              </Box>
            ) : tracks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No tracks found</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
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
                            alt={track.name}
                            sx={{
                              width: 50,
                              height: 50,
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                        </TableCell>
                        <TableCell>{track.name}</TableCell>
                        <TableCell>{formatDuration(track.duration_ms)}</TableCell>
                        <TableCell>
                          {new Date(track.release_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {track.label 
                            ? track.label
                                .replace('buildit-', 'Build It ')
                                .replace(/^\w/, c => c.toUpperCase())
                            : 'Unknown Label'}
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
