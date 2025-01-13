import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Link,
  Skeleton
} from '@mui/material';
import { Artist } from '../types/artist';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  const [imageLoading, setImageLoading] = React.useState(true);

  // Get image URL from either profile_image or images array
  const getImageUrl = () => {
    if (artist.profile_image) {
      return artist.profile_image;
    }
    
    if (artist.images && artist.images.length > 0) {
      const sortedImages = [...artist.images].sort((a, b) => {
        const aSize = (a.width || 0) * (a.height || 0);
        const bSize = (b.width || 0) * (b.height || 0);
        return bSize - aSize;
      });
      return sortedImages[0].url;
    }

    return '';
  };

  const imageUrl = getImageUrl();

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out'
        } : {}
      }}
    >
      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
        {imageLoading && (
          <Skeleton 
            variant="rectangular" 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }} 
          />
        )}
        {imageUrl && (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={artist.name}
            onLoad={handleImageLoad}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: imageLoading ? 'none' : 'block'
            }}
          />
        )}
      </Box>
      <CardContent>
        <Typography variant="h6" noWrap>
          {artist.name}
        </Typography>
        {artist.followers && (
          <Typography variant="body2" color="text.secondary">
            {artist.followers.total.toLocaleString()} followers
          </Typography>
        )}
        {(artist.spotify_url || artist.external_urls?.spotify) && (
          <Link
            href={artist.spotify_url || artist.external_urls?.spotify}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            sx={{ 
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Open in Spotify
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default ArtistCard;
