import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Link,
  IconButton,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { formatDuration } from '../utils/trackUtils';
import { Track } from '../types/track';

interface TrackDetailsProps {
  track: Track;
  loading?: boolean;
  error?: string | null;
}

export const TrackDetails: React.FC<TrackDetailsProps> = ({
  track,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!track) return null;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {track.album?.images?.[0] && (
            <Box
              component="img"
              src={track.album.images[0].url}
              alt={track.title}
              sx={{
                width: '100%',
                height: 'auto',
                maxWidth: 300,
                borderRadius: 2,
              }}
            />
          )}
        </Grid>
        <Grid item xs={12} md={8}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" gutterBottom>
              {track.title}
            </Typography>
            {track.external_urls?.spotify && (
              <IconButton
                component={Link}
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                size="large"
                color="primary"
              >
                <PlayIcon />
              </IconButton>
            )}
          </Box>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {track.artists.map(artist => artist.name).join(', ')}
          </Typography>

          <Box mt={2}>
            <Typography variant="body1" gutterBottom>
              Album: {track.album?.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Duration: {formatDuration(track.duration_ms)}
            </Typography>
            {track.album?.release_date && (
              <Typography variant="body1" gutterBottom>
                Release Date: {new Date(track.album.release_date).toLocaleDateString()}
              </Typography>
            )}
            <Typography variant="body1" gutterBottom>
              Track Number: {track.track_number}
            </Typography>
            {track.explicit && (
              <Typography variant="body1" color="error" gutterBottom>
                Explicit
              </Typography>
            )}
          </Box>

          {track.preview_url && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                Preview
              </Typography>
              <audio controls src={track.preview_url}>
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
