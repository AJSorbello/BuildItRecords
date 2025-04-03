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
          p: 6,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${alpha('#00BFFF', 0.2)}, ${alpha('#00BFFF', 0.05)})`,
          border: '1px solid rgba(0, 191, 255, 0.25)',
          boxShadow: '0 0 30px rgba(0, 191, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(0, 191, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          color: '#00BFFF', 
          fontWeight: 800,
          fontSize: '4.5rem',
          textShadow: '0 0 10px rgba(0, 191, 255, 0.25)',
          letterSpacing: '-0.02em'
        }}>
          Build It Deep
        </Typography>
        <Typography variant="h5" sx={{ 
          mb: 4,
          color: '#FFFFFF',
          textShadow: '0 0 10px rgba(0, 0, 0, 0.7)'
        }}>
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
