import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Track } from '../types/track';

interface PlaylistTrackListProps {
  tracks: Track[];
}

const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ tracks }) => {
  const handlePlayClick = (track: Track) => {
    if (track.spotifyUrl) {
      window.open(track.spotifyUrl, '_blank');
    }
  };

  if (!tracks.length) {
    return (
      <Typography variant="body1" color="text.secondary" align="center">
        No tracks available
      </Typography>
    );
  }

  return (
    <List>
      {tracks.map((track) => (
        <ListItem
          key={track.id}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          secondaryAction={
            <Box>
              {track.spotifyUrl && (
                <IconButton
                  edge="end"
                  aria-label="open in spotify"
                  onClick={() => window.open(track.spotifyUrl, '_blank')}
                >
                  <OpenInNewIcon />
                </IconButton>
              )}
              <IconButton
                edge="end"
                aria-label="play"
                onClick={() => handlePlayClick(track)}
              >
                <PlayArrowIcon />
              </IconButton>
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar
              alt={track.title}
              src={track.artworkUrl || '/default-album-art.png'}
              variant="rounded"
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
                {track.album && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {' • '}{track.album.name}
                  </Typography>
                )}
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default PlaylistTrackList;
