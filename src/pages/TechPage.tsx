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
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${alpha(techColor, 0.1)}, ${alpha(
            theme.palette.background.default,
            0.2
          )})`,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom sx={{ color: techColor, fontWeight: 700 }}>
          Build It Tech
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
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
