import React from 'react';
import {
  Box,
  Typography,
  Link,
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

const FeaturedRelease: React.FC<FeaturedReleaseProps> = ({ release }) => {
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
        image={release.imageUrl || release.artwork || release.artworkUrl}
        alt={`${release.title} by ${release.artist.name}`}
        sx={{
          height: 400,
          objectFit: 'cover'
        }}
      />
      
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, color: colors.text }}>
          {release.title}
        </Typography>
        
        <Typography variant="h5" sx={{ mb: 2, color: colors.textSecondary }}>
          {release.artist.name}
        </Typography>

        {release.genre && (
          <Typography variant="body1" sx={{ mb: 2, color: colors.textSecondary }}>
            {release.genre}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mb: 3, color: colors.textSecondary }}>
          {new Date(release.releaseDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>

        <Stack direction="row" spacing={2}>
          {release.stores?.spotify && (
            <Button
              variant="contained"
              startIcon={<MusicNoteIcon />}
              onClick={() => openLink(release.stores?.spotify)}
              sx={{ backgroundColor: colors.primary }}
            >
              Spotify
            </Button>
          )}
          
          {release.stores?.beatport && (
            <Button
              variant="contained"
              startIcon={<AlbumIcon />}
              onClick={() => openLink(release.stores?.beatport)}
              sx={{ backgroundColor: colors.primary }}
            >
              Beatport
            </Button>
          )}
          
          {release.stores?.soundcloud && (
            <Button
              variant="contained"
              startIcon={<CloudQueueIcon />}
              onClick={() => openLink(release.stores?.soundcloud)}
              sx={{ backgroundColor: colors.primary }}
            >
              SoundCloud
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default FeaturedRelease;
