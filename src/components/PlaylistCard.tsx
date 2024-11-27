import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Link,
  Chip,
} from '@mui/material';
import SpotifyIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface PlaylistCardProps {
  title: string;
  description: string;
  imageUrl: string;
  spotifyUrl: string;
  trackCount: number;
  duration: string;
  tags?: string[];
  label: 'records' | 'tech' | 'deep';
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  title,
  description,
  imageUrl,
  spotifyUrl,
  trackCount,
  duration,
  tags = [],
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
        alt={title}
        sx={{
          objectFit: 'cover',
        }}
      />
      <CardContent>
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        >
          {title}
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
          {description}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PlayArrowIcon fontSize="small" />
            <Typography variant="body2">{trackCount} tracks</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2">{duration}</Typography>
          </Box>
        </Box>

        {tags.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
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
        </Box>
      </CardContent>
    </Card>
  );
};
