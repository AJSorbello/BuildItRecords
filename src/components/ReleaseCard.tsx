import React, { useState, useRef } from 'react';
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
import { Release, Track } from '../types/release';

interface ReleaseCardProps {
  release: Release;
  compact?: boolean;
  featured?: boolean;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, compact = false, featured = false }) => {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = async (track: Track) => {
    if (!track.previewUrl) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(track.previewUrl);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      });
      
      audio.play();
      setIsPlaying(true);
      setCurrentTrack(track);
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.card,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <CardMedia
        component="img"
        image={release.artwork}
        alt={`${release.title} by ${release.artist}`}
        sx={{
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
        }}
      />
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1, color: colors.text }}>
          {release.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {release.artist}
        </Typography>
        
        {!compact && (
          <Box sx={{ mt: 2 }}>
            {release.tracks.map((track) => (
              <Box
                key={track.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handlePlayPause(track)}
                  disabled={!track.previewUrl}
                  sx={{ mr: 1 }}
                >
                  {isPlaying && currentTrack?.id === track.id ? (
                    <PauseIcon />
                  ) : (
                    <PlayArrowIcon />
                  )}
                </IconButton>
                <Typography variant="body2" sx={{ color: colors.text }}>
                  {track.title}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {release.spotifyUrl && (
            <IconButton
              component={Link}
              href={release.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#1DB954' }}
            >
              <MusicNoteIcon />
            </IconButton>
          )}
          {release.beatportUrl && (
            <IconButton
              component={Link}
              href={release.beatportUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#FF6B00' }}
            >
              <AlbumIcon />
            </IconButton>
          )}
          {release.soundcloudUrl && (
            <IconButton
              component={Link}
              href={release.soundcloudUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#FF7700' }}
            >
              <CloudQueueIcon />
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
