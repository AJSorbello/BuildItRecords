import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Link,
} from '@mui/material';
import SpotifyIcon from '@mui/icons-material/MusicNote';
import InstagramIcon from '@mui/icons-material/Instagram';
import SoundcloudIcon from '@mui/icons-material/CloudQueue';

interface ArtistCardProps {
  name: string;
  imageUrl: string;
  bio: string;
  spotifyUrl?: string;
  instagramUrl?: string;
  soundcloudUrl?: string;
  label: 'records' | 'tech' | 'deep';
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  name,
  imageUrl,
  bio,
  spotifyUrl,
  instagramUrl,
  soundcloudUrl,
  label,
}) => {
  const labelColors = {
    records: '#02FF95',
    tech: '#FF0000',
    deep: '#00BFFF'
  };

  const color = labelColors[label];

  return (
    <Card
      sx={{
        maxWidth: 345,
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      <CardMedia
        component="img"
        height="345"
        image={imageUrl}
        alt={name}
        sx={{
          objectFit: 'cover',
        }}
      />
      <CardContent>
        <Typography
          gutterBottom
          variant="h5"
          component="div"
          sx={{
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        >
          {name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 2,
            minHeight: '3em',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {bio}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            mt: 2,
          }}
        >
          {spotifyUrl && (
            <IconButton
              component={Link}
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#FFFFFF',
                '&:hover': {
                  color: color,
                },
              }}
            >
              <SpotifyIcon />
            </IconButton>
          )}
          {instagramUrl && (
            <IconButton
              component={Link}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#FFFFFF',
                '&:hover': {
                  color: color,
                },
              }}
            >
              <InstagramIcon />
            </IconButton>
          )}
          {soundcloudUrl && (
            <IconButton
              component={Link}
              href={soundcloudUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#FFFFFF',
                '&:hover': {
                  color: color,
                },
              }}
            >
              <SoundcloudIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
