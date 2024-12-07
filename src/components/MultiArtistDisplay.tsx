import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { ArtistCard } from './ArtistCard';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  external_urls: {
    spotify?: string;
    instagram?: string;
    soundcloud?: string;
  };
}

interface MultiArtistDisplayProps {
  artists: Artist[];
  label?: 'records' | 'tech' | 'deep';
}

export const MultiArtistDisplay: React.FC<MultiArtistDisplayProps> = ({
  artists,
  label = 'records'
}) => {
  if (!artists || artists.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      {artists.length > 1 && (
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            mb: 2,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          Featured Artists
        </Typography>
      )}
      <Grid
        container
        spacing={4}
        justifyContent={artists.length === 1 ? 'center' : 'flex-start'}
      >
        {artists.map((artist) => (
          <Grid
            item
            key={artist.id}
            xs={12}
            sm={6}
            md={artists.length === 1 ? 4 : 6}
            lg={artists.length === 1 ? 3 : 4}
          >
            <ArtistCard
              name={artist.name}
              imageUrl={artist.images[0]?.url || '/default-artist-image.jpg'}
              bio={artist.genres.join(', ')}
              spotifyUrl={artist.external_urls.spotify}
              instagramUrl={artist.external_urls.instagram}
              soundcloudUrl={artist.external_urls.soundcloud}
              label={label}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
