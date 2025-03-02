import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { labelColors } from '../theme/theme';

const DeepPage: React.FC = () => {
  const theme = useTheme();
  const deepColor = labelColors.deep;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 8,
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${alpha(deepColor, 0.1)}, ${alpha(
            theme.palette.background.default,
            0.2
          )})`,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom sx={{ color: deepColor, fontWeight: 700 }}>
          Build It Deep
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          The Soul of Underground House Music
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Foundation
        </Typography>
        <Typography paragraph>
          Build It Deep represents the purest expression of underground house music. Founded in 2023,
          our label emerged from a passion for the deeper, more soulful side of electronic music.
          We believe in music that doesn't just move your feet, but touches your soul.
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Sound
        </Typography>
        <Typography paragraph>
          Deep, warm basslines, hypnotic rhythms, and atmospheric soundscapes define the Build It Deep sound.
          We specialize in deep house, tech house, and minimal techno that prioritizes quality and feeling
          over commercial appeal. Each release is carefully curated to maintain our high standards and
          unique sonic identity.
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Artist Development
        </Typography>
        <Typography paragraph>
          At Build It Deep, we're more than just a record label - we're a community of artists who
          share a common vision. We work closely with both established and emerging talents,
          providing a platform for innovative producers who push the boundaries of deep house music.
          Our commitment to artist development has helped launch several careers in the underground
          electronic music scene.
        </Typography>
      </Box>

      <Box>
        <Typography variant="h4" component="h2" gutterBottom>
          Vision & Future
        </Typography>
        <Typography paragraph>
          Looking ahead, Build It Deep continues to evolve while staying true to our core values.
          We're expanding our reach through digital platforms while maintaining the intimate
          connection with our audience that deep house music naturally creates. Through carefully
          selected releases and events, we aim to strengthen our position as a leading voice in
          the underground electronic music community.
        </Typography>
      </Box>
    </Container>
  );
};

export default DeepPage;
