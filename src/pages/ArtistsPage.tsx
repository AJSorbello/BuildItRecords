import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import { labelColors } from '../theme/theme';

interface Artist {
  id: string;
  name: string;
  image: string;
  bio: string;
}

interface ArtistsPageProps {
  label: 'records' | 'tech' | 'deep';
}

const getArtists = (label: string): Artist[] => {
  switch (label) {
    case 'tech':
      return [
        {
          id: '1',
          name: 'Techno Artist 1',
          image: '/path/to/tech-artist1.jpg',
          bio: 'Pioneering the techno scene with innovative sounds.',
        },
        {
          id: '2',
          name: 'Techno Artist 2',
          image: '/path/to/tech-artist2.jpg',
          bio: 'Pushing boundaries in industrial techno.',
        }
      ];
    case 'deep':
      return [
        {
          id: '1',
          name: 'Deep House Artist 1',
          image: '/path/to/deep-artist1.jpg',
          bio: 'Creating atmospheric deep house journeys.',
        },
        {
          id: '2',
          name: 'Deep House Artist 2',
          image: '/path/to/deep-artist2.jpg',
          bio: 'Melodic deep house productions.',
        }
      ];
    default:
      return [
        {
          id: '1',
          name: 'House Artist 1',
          image: '/path/to/house-artist1.jpg',
          bio: 'Underground house music pioneer.',
        },
        {
          id: '2',
          name: 'House Artist 2',
          image: '/path/to/house-artist2.jpg',
          bio: 'Soulful house music producer.',
        }
      ];
  }
};

const ArtistsPage: React.FC<ArtistsPageProps> = ({ label }) => {
  const artists = getArtists(label);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Artists
      </Typography>

      <Grid container spacing={4}>
        {artists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} key={artist.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="300"
                  image={artist.image}
                  alt={artist.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
                    {artist.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    {artist.bio}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ArtistsPage;
