import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { Release } from '../types';
import { getArtistNames } from '../utils/trackUtils';

interface ReleaseCardProps {
  release: Release;
  featured?: boolean;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, featured = false }) => {
  const imageHeight = featured ? 300 : 200;

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out'
        }
      }}
      onClick={() => window.open(release.spotifyUrl, '_blank')}
    >
      <CardMedia
        component="img"
        height={imageHeight}
        image={release.artworkUrl}
        alt={`${release.title} cover art`}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          noWrap 
          sx={{ 
            fontWeight: 'bold',
            fontSize: featured ? '1.25rem' : '1rem'
          }}
        >
          {release.title}
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          noWrap
          sx={{ fontSize: featured ? '1rem' : '0.875rem' }}
        >
          {release.artists.map(artist => artist.name).join(', ')}
        </Typography>
        {featured && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {new Date(release.releaseDate).toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
