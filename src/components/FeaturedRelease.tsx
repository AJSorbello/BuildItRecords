import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Stack,
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { useTheme } from '../contexts/ThemeContext';
import { Release } from '../types/release';

interface FeaturedReleaseProps {
  release: Release;
}

export default function FeaturedRelease({ release }: FeaturedReleaseProps) {
  const { colors } = useTheme();

  const openLink = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card sx={{ 
      backgroundColor: colors.card,
      borderRadius: 2,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <CardMedia
        component="img"
        image={release.artwork}
        alt={`${release.title} by ${release.artist}`}
        sx={{
          height: 400,
          objectFit: 'cover'
        }}
      />
      
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, color: colors.text }}>
          {release.title}
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, color: colors.textSecondary }}>
          {release.artist}
        </Typography>
        
        <Stack direction="row" spacing={2}>
          {release.spotifyUrl && (
            <Button
              variant="contained"
              startIcon={<MusicNoteIcon />}
              onClick={() => openLink(release.spotifyUrl)}
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
          
          {release.beatportUrl && (
            <Button
              variant="contained"
              startIcon={<AlbumIcon />}
              onClick={() => openLink(release.beatportUrl)}
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
          
          {release.soundcloudUrl && (
            <Button
              variant="contained"
              startIcon={<CloudQueueIcon />}
              onClick={() => openLink(release.soundcloudUrl)}
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
      </CardContent>
    </Card>
  );
}
