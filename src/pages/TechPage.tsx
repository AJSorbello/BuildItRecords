import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { labelColors } from '../theme/theme';

const TechPage: React.FC = () => {
  const theme = useTheme();
  const techColor = labelColors.tech;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 8,
          p: 6,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${alpha('#FF0000', 0.2)}, ${alpha('#FF0000', 0.05)})`,
          border: '1px solid rgba(255, 0, 0, 0.25)',
          boxShadow: '0 0 30px rgba(255, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(255, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          color: '#FF0000', 
          fontWeight: 800,
          fontSize: '4.5rem',
          textShadow: '0 0 10px rgba(255, 0, 0, 0.25)',
          letterSpacing: '-0.02em'
        }}>
          Build It Tech
        </Typography>
        <Typography variant="h5" sx={{ 
          mb: 4,
          color: '#FFFFFF',
          textShadow: '0 0 10px rgba(0, 0, 0, 0.7)'
        }}>
          Pushing Boundaries in Tech House
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
          Build It Tech delivers electrifying tech house, minimal deep tech, and driving club sounds engineered for peak energy moments. Our releases fuse infectious grooves with innovative sound design, creating dynamic productions that command attention at festivals, clubs, and beyond. With relentless rhythms and genre-defying creativity, Build It Tech represents the cutting edge of electronic music made to move dancefloors worldwide.
        </Typography>
      </Box>
    </Container>
  );
};

export default TechPage;
