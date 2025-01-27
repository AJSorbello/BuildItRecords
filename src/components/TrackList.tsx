import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Paper,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { Track } from '../types/track';
import { formatDuration } from '../utils/trackUtils';

interface TrackListProps {
  tracks: Track[];
  loading?: boolean;
  error?: string | null;
  onTrackClick?: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  loading,
  error,
  onTrackClick,
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

  if (!tracks.length) {
    return (
      <Box p={4}>
        <Typography color="text.secondary">No tracks found</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={1}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {tracks.map((track, index) => (
          <ListItem
            key={track.id}
            button
            onClick={() => onTrackClick?.(track)}
            divider={index !== tracks.length - 1}
          >
            <ListItemAvatar>
              <Avatar
                variant="square"
                src={track.album?.images?.[0]?.url}
                alt={track.title}
              />
            </ListItemAvatar>
            <ListItemText
              primary={track.title}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {track.artists.map(artist => artist.name).join(', ')}
                  </Typography>
                  {' — '}
                  {track.album?.name}
                  {' • '}
                  {formatDuration(track.duration_ms || 0)}
                </React.Fragment>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="play"
                onClick={(e) => {
                  e.stopPropagation();
                  if (track.external_urls?.spotify) {
                    window.open(track.external_urls.spotify, '_blank');
                  }
                }}
              >
                <PlayIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TrackList;
