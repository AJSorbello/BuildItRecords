import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const DeepPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 2,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Build It Deep
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            The Soul of Underground House Music
          </Typography>
          <Typography variant="body1" paragraph>
            Build It Deep represents the purest expression of underground house music. Founded in 2023,
            our label emerged from a passion for the deeper, more soulful side of electronic music.
            We believe in music that doesn't just move your feet, but touches your soul.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Our Sound
          </Typography>
          <Typography variant="body1" paragraph>
            Deep, warm basslines, hypnotic rhythms, and atmospheric soundscapes define the Build It Deep sound.
            We specialize in deep house, tech house, and minimal techno that prioritizes quality and feeling
            over commercial appeal. Each release is carefully curated to maintain our high standards and
            unique sonic identity.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Artist Development
          </Typography>
          <Typography variant="body1" paragraph>
            At Build It Deep, we're more than just a record label - we're a community of artists who
            share a common vision. We work closely with both established and emerging talents,
            providing a platform for innovative producers who push the boundaries of deep house music.
            Our commitment to artist development has helped launch several careers in the underground
            electronic music scene.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Vision & Future
          </Typography>
          <Typography variant="body1" paragraph>
            Looking ahead, Build It Deep continues to evolve while staying true to our core values.
            We're expanding our reach through digital platforms while maintaining the intimate
            connection with our audience that deep house music naturally creates. Through carefully
            selected releases and events, we aim to strengthen our position as a leading voice in
            the underground electronic music community.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DeepPage;
