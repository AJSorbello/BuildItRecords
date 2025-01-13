import React from 'react';
import { Track } from '../types/models';
import { formatDuration } from '../utils/formatters';
import { Box, IconButton, Link, List, ListItem, Typography } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface TrackListProps {
  tracks: Track[];
  currentTrack?: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPauseTrack
}) => {
  const handlePlayClick = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      onPauseTrack();
    } else {
      onPlayTrack(track);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTrackItem = (track: Track) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    const artistNames = track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
    const release = track.release;

    return (
      <ListItem
        key={track.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        <IconButton
          onClick={() => handlePlayClick(track)}
          sx={{ color: isCurrentTrack ? 'primary.main' : 'inherit' }}
        >
          {isCurrentTrack && isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>

        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, ml: 2 }}>
          <Link
            href={track.spotify_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            <Typography variant="subtitle1" component="span">
              {track.name}
            </Typography>
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {artistNames}
            </Typography>
            {release && (
              <Typography variant="body2" color="text.secondary">
                • {release.title}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {release?.artwork_url && (
            <Box
              component="img"
              src={release.artwork_url}
              alt={release.title}
              sx={{
                width: 40,
                height: 40,
                objectFit: 'cover',
                borderRadius: 1
              }}
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px', textAlign: 'right' }}>
            {formatDate(release?.release_date)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px', textAlign: 'right' }}>
            {formatDuration(track.duration_ms || 0)}
          </Typography>
        </Box>
      </ListItem>
    );
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent' }}>
      {tracks.map(renderTrackItem)}
    </List>
  );
};

export default TrackList;
