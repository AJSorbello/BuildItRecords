import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Link,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { useTheme } from '../contexts/ThemeContext';
import { Track } from '../types/track';
import { Release } from '../types/release';

interface ReleaseCardProps {
  release: Release;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release }) => {
  const { colors } = useTheme();

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '400px',
        maxHeight: '400px',
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <CardMedia
        component="img"
        height="300"
        image={release.imageUrl || release.artwork || release.artworkUrl}
        alt={release.title}
        sx={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
        }}
      />
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 2,
        }}
      >
        <Box>
          <Typography variant="h6" component="div" sx={{ color: colors.text }}>
            {release.title}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: colors.textSecondary }}>
            {release.artist.name}
          </Typography>
          {release.genre && (
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              {release.genre}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {release.stores?.spotify && (
            <IconButton
              size="small"
              href={release.stores.spotify}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: colors.text }}
            >
              <MusicNoteIcon />
            </IconButton>
          )}
          {release.stores?.beatport && (
            <IconButton
              size="small"
              href={release.stores.beatport}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: colors.text }}
            >
              <AlbumIcon />
            </IconButton>
          )}
          {release.stores?.soundcloud && (
            <IconButton
              size="small"
              href={release.stores.soundcloud}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: colors.text }}
            >
              <CloudQueueIcon />
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

interface TrackCardProps {
  track: Track;
  onPlay?: (track: Track) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onPlay }) => {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (onPlay) {
      onPlay(track);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(track.preview_url || '');
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.card,
        borderRadius: 2,
      }}
    >
      <CardMedia
        component="img"
        height="140"
        image={track.albumCover || track.imageUrl}
        alt={track.name}
      />
      <CardContent>
        <Typography variant="h6" component="div" sx={{ color: colors.text }}>
          {track.name}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: colors.textSecondary }}>
          {track.artist.name}
        </Typography>
        {track.preview_url && (
          <IconButton onClick={handlePlayPause} sx={{ color: colors.text }}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        )}
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
