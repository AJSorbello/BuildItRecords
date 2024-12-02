import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import { LabelKey } from '../types/labels';

interface Artist {
  id: string;
  name: string;
  image: string;
  bio: string;
}

interface ArtistsPageProps {
  label: LabelKey;
}

// Helper function to generate a simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const getArtists = (label: LabelKey): Artist[] => {
  // Get tracks from localStorage
  const storedTracks = localStorage.getItem('tracks');
  if (!storedTracks) return [];
  
  try {
    const allTracks = JSON.parse(storedTracks);
    
    // Get unique artists by label
    const artistsByLabel = allTracks
      .filter((track: any) => {
        switch (label) {
          case 'RECORDS':
            return track.recordLabel === 'BUILD IT RECORDS';
          case 'TECH':
            return track.recordLabel === 'BUILD IT TECH';
          case 'DEEP':
            return track.recordLabel === 'BUILD IT DEEP';
          default:
            return false;
        }
      })
      .reduce((artists: { [key: string]: Artist }, track: any) => {
        if (!artists[track.artist]) {
          artists[track.artist] = {
            id: generateId(),
            name: track.artist,
            image: track.albumCover || 'https://via.placeholder.com/300',
            bio: `Artist on ${track.recordLabel}` // TODO: Add proper artist bios
          };
        }
        return artists;
      }, {});
    
    return Object.values(artistsByLabel);
  } catch (error) {
    console.error('Error loading artists:', error);
    return [];
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
