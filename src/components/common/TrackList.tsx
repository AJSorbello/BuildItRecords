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
import { Track } from '../../types/models';
import { formatDuration } from '../../utils/formatters';

export interface TrackListProps {
  tracks: Track[];
  loading?: boolean;
  error?: string | null;
  renderTrackActions?: (track: Track) => React.ReactNode;
  onTrackClick?: (track: Track) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  loading,
  error,
  renderTrackActions,
  onTrackClick,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  if (!tracks.length) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        No tracks found
      </Typography>
    );
  }

  return (
    <Paper elevation={0}>
      <List>
        {tracks.map((track) => (
          <ListItem
            key={track.id}
            button={!!onTrackClick}
            onClick={() => onTrackClick?.(track)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={track.album?.images[0]?.url}
                alt={track.name}
              />
            </ListItemAvatar>
            <ListItemText
              primary={track.name}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {track.artists.map(artist => artist.name).join(', ')}
                  </Typography>
                  {track.album && (
                    <>
                      {' • '}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {track.album.name}
                      </Typography>
                    </>
                  )}
                  {' • '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {formatDuration(track.duration_ms)}
                  </Typography>
                </React.Fragment>
              }
            />
            {renderTrackActions && (
              <ListItemSecondaryAction>
                {renderTrackActions(track)}
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
