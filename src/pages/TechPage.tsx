import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TechPage: React.FC = () => {
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
          Build It Tech
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Pushing Boundaries in Tech House
          </Typography>
          <Typography variant="body1" paragraph>
            Build It Tech stands at the forefront of modern electronic music innovation. Launched as
            a sister label to Build It Deep, we focus on the cutting edge of tech house, techno,
            and progressive electronic music. Our mission is to push the boundaries of what's possible
            in electronic music while maintaining the highest production standards.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Musical Identity
          </Typography>
          <Typography variant="body1" paragraph>
            The Build It Tech sound is characterized by driving rhythms, innovative sound design,
            and forward-thinking production techniques. We embrace both analog warmth and digital
            precision, creating a unique sonic palette that defines the modern tech house genre.
            Our releases often feature intricate percussion work, memorable hooks, and that
            essential peak-time energy that moves dance floors worldwide.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Innovation & Technology
          </Typography>
          <Typography variant="body1" paragraph>
            True to our name, we're constantly exploring new technologies and production methods.
            From cutting-edge synthesizers to innovative mixing techniques, Build It Tech embraces
            the latest advancements in music technology. We encourage our artists to experiment
            with new tools and techniques, pushing the boundaries of what's possible in electronic
            music production.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Global Impact
          </Typography>
          <Typography variant="body1" paragraph>
            While our sound is firmly rooted in tech house, our influence extends across the
            electronic music spectrum. Our releases regularly feature in sets by leading DJs
            and receive support from major players in the industry. Through our commitment to
            innovation and quality, we've established ourselves as a trusted source for
            forward-thinking electronic music that consistently delivers on the dance floor.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TechPage;
