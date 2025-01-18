import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Button,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Track } from '../../types/track';
import { getTrackImage, getTrackSpotifyUrl, getTrackBeatportUrl, getTrackSoundcloudUrl, getTrackArtists } from '../../utils/trackUtils';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';

interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  release: Track | null;
}

const ReleaseModal: React.FC<ReleaseModalProps> = ({ open, onClose, release }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  if (!release) return null;

  const openLink = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const artworkUrl = getTrackImage(release);
  const spotifyUrl = getTrackSpotifyUrl(release);
  const beatportUrl = getTrackBeatportUrl(release);
  const soundcloudUrl = getTrackSoundcloudUrl(release);
  const artists = getTrackArtists(release);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {release.title || release.name}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Artwork Section */}
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={artworkUrl || '/assets/images/default-release.jpg'}
              alt={release.title || release.name}
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 1,
                boxShadow: 3
              }}
            />
          </Grid>

          {/* Details Section */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Artists */}
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Artists
                </Typography>
                <Typography variant="h6">
                  {artists}
                </Typography>
              </Box>

              {/* Release Date */}
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Release Date
                </Typography>
                <Typography variant="body1">
                  {new Date(release.release_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              {/* Label */}
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Label
                </Typography>
                <Typography variant="body1">
                  {release.label?.name || 'Unknown Label'}
                </Typography>
              </Box>

              {/* Links */}
              <Stack direction="row" spacing={2}>
                {spotifyUrl && (
                  <Button
                    variant="contained"
                    startIcon={<MusicNoteIcon />}
                    onClick={() => openLink(spotifyUrl)}
                    sx={{
                      bgcolor: '#1DB954',
                      '&:hover': {
                        bgcolor: '#1ed760'
                      }
                    }}
                  >
                    Spotify
                  </Button>
                )}
                
                {beatportUrl && (
                  <Button
                    variant="contained"
                    startIcon={<AlbumIcon />}
                    onClick={() => openLink(beatportUrl)}
                    sx={{
                      bgcolor: '#FF6B00',
                      '&:hover': {
                        bgcolor: '#ff7b1c'
                      }
                    }}
                  >
                    Beatport
                  </Button>
                )}
                
                {soundcloudUrl && (
                  <Button
                    variant="contained"
                    startIcon={<CloudQueueIcon />}
                    onClick={() => openLink(soundcloudUrl)}
                    sx={{
                      bgcolor: '#FF5500',
                      '&:hover': {
                        bgcolor: '#ff6a1f'
                      }
                    }}
                  >
                    Soundcloud
                  </Button>
                )}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseModal;
