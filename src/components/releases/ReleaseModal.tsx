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
import { Release } from '../../types/Release';
import { Artist } from '../../types/Artist';

interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  release: Release | null;
  onArtistClick: (artist: Artist) => void;
}

const ArtistPreview: React.FC<{ artist: Artist, onClick: () => void }> = ({ artist, onClick }) => (
  <Card sx={{ cursor: 'pointer', mb: 1 }} onClick={onClick}>
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
      <CardMedia
        component="img"
        sx={{ width: 50, height: 50, borderRadius: 1, mr: 2 }}
        image={artist.profile_image || artist.images?.[0]?.url}
        alt={artist.name}
      />
      <CardContent sx={{ flex: '1 1 auto', py: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="subtitle1">{artist.name}</Typography>
      </CardContent>
    </Box>
  </Card>
);

const ReleaseModal: React.FC<ReleaseModalProps> = ({ open, onClose, release, onArtistClick }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
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
              src={release.artwork_url || release.tracks?.[0]?.artwork_url || release.tracks?.[0]?.album?.artwork_url}
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
              Artists
            </Typography>
            <Box>
              {release.artists?.map((artist) => (
                <ArtistPreview
                  key={artist.id}
                  artist={artist}
                  onClick={() => onArtistClick(artist)}
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
                    <TableCell>Links</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {release.tracks?.map((track, index) => (
                    <TableRow key={track.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{track.name}</TableCell>
                      <TableCell>
                        <Box>
                          {track.artists?.map((artist, artistIndex) => (
                            <React.Fragment key={artist.id}>
                              <Button
                                onClick={() => onArtistClick(artist)}
                                sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                                color="primary"
                              >
                                {artist.name}
                              </Button>
                              {artistIndex < (track.artists?.length || 0) - 1 ? ', ' : ''}
                            </React.Fragment>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDuration(track.duration_ms)}</TableCell>
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
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseModal;
