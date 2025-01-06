import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { Track } from '../types/track';
import { formatDuration } from '../utils/trackUtils';
import { useSpotifyPlaylists } from '../hooks/useSpotifyPlaylists';

interface PlaylistTrackListProps {
  playlistId: string;
  tracks?: Track[];
}

export const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ playlistId, tracks: initialTracks }) => {
  const { tracks: fetchedTracks, loading, error } = useSpotifyPlaylists(playlistId);
  const [displayTracks, setDisplayTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (initialTracks) {
      setDisplayTracks(initialTracks);
    } else if (fetchedTracks) {
      setDisplayTracks(fetchedTracks);
    }
  }, [initialTracks, fetchedTracks]);

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
        Error loading tracks: {error}
      </Typography>
    );
  }

  if (!displayTracks.length) {
    return (
      <Typography sx={{ p: 2 }}>
        No tracks found in this playlist.
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {displayTracks.map((track) => (
        <ListItem
          key={track.id}
          alignItems="center"
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="play"
              onClick={() => window.open(track.external_urls.spotify, '_blank')}
            >
              <PlayIcon />
            </IconButton>
          }
        >
          <ListItemAvatar>
            <Avatar
              alt={track.name}
              src={track.album.images?.[0]?.url || '/placeholder-album.png'}
              variant="square"
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
                {' — '}
                {formatDuration(track.duration_ms)}
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};
