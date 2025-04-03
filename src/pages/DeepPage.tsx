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
        <Typography variant="body1" sx={{ 
          fontSize: '1.125rem', 
          lineHeight: 1.8,
          textAlign: 'center',
          maxWidth: '900px',
          mx: 'auto',
          color: '#e0e0e0'
        }}>
          Build It Deep was created to celebrate the rich textures of underground house music—where rhythm meets soul. Rooted in a deep love for Afro House, Deep House, Melodic House, and Progressive House, we exist to share sounds that move people on a deeper level. Every release reflects our commitment to emotion, groove, and sonic depth—crafted for true heads, dance floors, and late-night journeys.
        </Typography>
      </Box>
    </Container>
  );
};

export default DeepPage;
