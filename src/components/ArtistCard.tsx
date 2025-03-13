import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { Artist } from '../types/artist';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
  background?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick, background }) => {
  // Try all possible image fields - added image_url as the first option to check
  const artistImage = artist.image_url || 
                      artist.profile_image_url || 
                      artist.profile_image_small_url || 
                      artist.profile_image_large_url || 
                      `https://placehold.co/300x300/DEDEDE/555555?text=${encodeURIComponent(artist.name)}`;

  // Log the image URL being used for debugging
  console.log(`[DEBUG] Artist card image for ${artist.name}:`, {
    image_url: artist.image_url,
    profile_image_url: artist.profile_image_url,
    using: artistImage
  });

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
      <Box sx={{ 
        position: 'relative',
        paddingTop: '100%', // This creates a 1:1 aspect ratio container
        width: '100%',
        overflow: 'hidden'
      }}>
        <CardMedia
          component="img"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          image={artistImage}
          alt={artist.name || 'Unknown Artist'}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            // Fallback to a reliable placeholder service if image fails to load
            const target = e.target as HTMLImageElement;
            // Use placehold.co as a fallback with artist name
            target.src = `/images/placeholder-artist.jpg`;
            console.log(`[DEBUG] Image failed to load for artist ${artist.name}, using fallback`);
          }}
        />
      </Box>
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
