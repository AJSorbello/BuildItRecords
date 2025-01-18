import React from 'react';
import { Card, CardContent, CardMedia, Typography, IconButton, Box } from '@mui/material';
import { MusicNote as MusicIcon } from '@mui/icons-material';
import { Artist } from '../types/artist';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  const artistImage = artist.images?.[0]?.url || '/placeholder-artist.jpg';
  const spotifyUrl = artist.external_urls.spotify;

  return (
    <Card 
      sx={{ 
        maxWidth: 345,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={artistImage}
        alt={artist.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography gutterBottom variant="h6" component="div">
            {artist.name}
          </Typography>
          {spotifyUrl && (
            <IconButton 
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <MusicIcon />
            </IconButton>
          )}
        </Box>
        {artist.genres && artist.genres.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {artist.genres.join(', ')}
          </Typography>
        )}
        {artist.followers && (
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
