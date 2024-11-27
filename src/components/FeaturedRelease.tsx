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

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card sx={{ 
      bgcolor: colors.background,
      p: 3,
      my: 3,
      borderRadius: 2,
    }}>
      <Typography
        variant="overline"
        sx={{
          color: colors.textSecondary,
          display: 'block',
          mb: 2,
        }}
      >
        Latest Release
      </Typography>
      
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
      }}>
        <CardMedia
          component="img"
          image={release.artwork}
          alt={`${release.title} by ${release.artist}`}
          sx={{
            width: { xs: '100%', md: '300px' },
            height: { xs: '300px', md: '300px' },
            objectFit: 'cover',
            borderRadius: 1,
          }}
        />
        
        <CardContent sx={{ 
          flex: 1,
          p: 0,
          '&:last-child': { pb: 0 },
        }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              color: colors.text,
              mb: 1,
              fontWeight: 'bold',
            }}
          >
            {release.artist}
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: colors.text,
              mb: 2,
            }}
          >
            {release.title}
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: colors.textSecondary,
              mb: 3,
            }}
          >
            {new Date(release.releaseDate).toLocaleDateString()}
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<MusicNoteIcon />}
              onClick={() => openLink(release.spotifyUrl)}
              sx={{
                bgcolor: '#1DB954',
                '&:hover': {
                  bgcolor: '#1aa34a',
                },
              }}
            >
              Spotify
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AlbumIcon />}
              onClick={() => openLink(release.beatportUrl)}
              sx={{
                bgcolor: '#FF6B00',
                '&:hover': {
                  bgcolor: '#e66000',
                },
              }}
            >
              Beatport
            </Button>
            
            <Button
              variant="contained"
              startIcon={<CloudQueueIcon />}
              onClick={() => openLink(release.soundcloudUrl)}
              sx={{
                bgcolor: '#FF5500',
                '&:hover': {
                  bgcolor: '#e64d00',
                },
              }}
            >
              SoundCloud
            </Button>
          </Stack>
        </CardContent>
      </Box>
    </Card>
  );
}
