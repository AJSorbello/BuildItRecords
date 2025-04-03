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
import { formatDuration } from '../utils/formatters';

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
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%', 
        bgcolor: 'rgba(20, 20, 22, 0.92)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <List sx={{ width: '100%' }}>
        {tracks.map((track, index) => (
          <ListItem
            key={track.id}
            button
            onClick={() => onTrackClick?.(track)}
            divider={index !== tracks.length - 1}
            sx={{
              borderBottom: index !== tracks.length - 1 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                variant="square"
                src={track.album?.images?.[0]?.url}
                alt={track.title}
                sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography 
                  variant="body1" 
                  sx={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 'medium' }}
                >
                  {track.title}
                </Typography>
              }
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {track.artists.map(artist => artist.name).join(', ')}
                  </Typography>
                  {' — '}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    {track.album?.name}
                    {' • '}
                    {formatDuration(track.duration_ms || 0)}
                  </Typography>
                </>
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
                sx={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  color: 'rgba(255, 255, 255, 0.9)',
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
