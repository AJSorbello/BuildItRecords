import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const AboutPage: React.FC = () => {
  const { label = 'records' } = useParams<{ label?: string }>();

  const labelInfo = {
    records: {
      title: 'Build It Records',
      description: 'Underground house music label focused on quality deep and tech house releases.',
      color: '#02FF95'
    },
    tech: {
      title: 'Build It Tech',
      description: 'Cutting-edge techno and tech house imprint pushing musical boundaries.',
      color: '#FF0000'
    },
    deep: {
      title: 'Build It Deep',
      description: 'Deep and melodic house music celebrating atmospheric and emotional soundscapes.',
      color: '#00BFFF'
    }
  };

  const info = labelInfo[label as keyof typeof labelInfo];

  return (
    <PageLayout label={label as 'records' | 'tech' | 'deep'}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            color: '#FFFFFF'
          }}
        >
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{ 
              color: info.color,
              fontWeight: 'bold',
              mb: 4
            }}
          >
            About {info.title}
          </Typography>
          
          <Typography variant="h6" paragraph>
            {info.description}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ color: info.color }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We're passionate about underground house music
            </Typography>
            <Typography paragraph>
              Our commitment to quality and innovation drives us to push boundaries and create unique sonic experiences.
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ color: info.color }}>
              Label Philosophy
            </Typography>
            <Typography paragraph>
              We believe in fostering a collaborative environment where artists can freely express their creativity 
              while maintaining the highest standards of production quality. Our releases are carefully curated to 
              ensure each track contributes something special to the electronic music landscape.
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ color: info.color }}>
              Join Our Community
            </Typography>
            <Typography>
              Whether you're an artist looking to release music or a fan seeking the latest underground sounds, 
              we welcome you to be part of our growing community. Follow us on social media and subscribe to our 
              newsletter to stay updated with our latest releases and events.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </PageLayout>
  );
};

export default AboutPage;
