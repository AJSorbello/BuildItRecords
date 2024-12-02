import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { LabelKey } from '../types/labels';

interface HomePageProps {
  label: LabelKey;
}

const HomePage: React.FC<HomePageProps> = ({ label }) => {
  const getFeaturedContent = () => {
    switch (label) {
      case 'TECH':
        return {
          title: 'Build It Tech',
          description: 'Pushing the boundaries of modern techno music.',
          releases: [
            { id: 1, title: 'Techno Release 1', artist: 'Artist A', image: '/path/to/image1.jpg' },
            { id: 2, title: 'Techno Release 2', artist: 'Artist B', image: '/path/to/image2.jpg' },
            { id: 3, title: 'Techno Release 3', artist: 'Artist C', image: '/path/to/image3.jpg' },
          ]
        };
      case 'DEEP':
        return {
          title: 'Build It Deep',
          description: 'Exploring the depths of deep house and melodic techno.',
          releases: [
            { id: 1, title: 'Deep House Release 1', artist: 'Artist X', image: '/path/to/image4.jpg' },
            { id: 2, title: 'Deep House Release 2', artist: 'Artist Y', image: '/path/to/image5.jpg' },
            { id: 3, title: 'Deep House Release 3', artist: 'Artist Z', image: '/path/to/image6.jpg' },
          ]
        };
      default:
        return {
          title: 'Build It Records',
          description: 'Underground electronic music for the discerning listener.',
          releases: [
            { id: 1, title: 'House Release 1', artist: 'Artist D', image: '/path/to/image7.jpg' },
            { id: 2, title: 'House Release 2', artist: 'Artist E', image: '/path/to/image8.jpg' },
            { id: 3, title: 'House Release 3', artist: 'Artist F', image: '/path/to/image9.jpg' },
          ]
        };
    }
  };

  const content = getFeaturedContent();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        {content.title}
      </Typography>
      
      <Typography variant="h5" sx={{ color: 'text.secondary', mb: 6 }}>
        {content.description}
      </Typography>

      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Featured Releases
      </Typography>

      <Grid container spacing={4}>
        {content.releases.map((release) => (
          <Grid item xs={12} sm={6} md={4} key={release.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}>
              <CardMedia
                component="img"
                height="200"
                image={release.image}
                alt={release.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
                  {release.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                  {release.artist}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
