import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { Artist } from '../types/artist';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
  background?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick, background }) => {
  // Try all possible image fields
  const artistImage = artist.profile_image_url || 
                      artist.profile_image_small_url || 
                      artist.profile_image_large_url || 
                      `https://via.placeholder.com/300x300?text=${encodeURIComponent(artist.name)}`;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 345,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: background || undefined,
        '&:hover': onClick ? {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out'
        } : {}
      }}
      onClick={handleClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={artistImage}
        alt={artist.name || 'Unknown Artist'}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          // Fallback to placeholder if image fails to load
          const target = e.target as HTMLImageElement;
          target.src = '/images/placeholder-artist.jpg';
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div">
          {artist.name || 'Unknown Artist'}
        </Typography>
        {artist.genres && artist.genres.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {artist.genres.join(', ')}
          </Typography>
        )}
        {artist.followers && artist.followers.total && (
          <Typography variant="body2" color="text.secondary">
            {artist.followers.total.toLocaleString()} followers
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export { ArtistCard };
export default ArtistCard;
