import React from 'react';
import {
  Container,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

const RecordsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 8,
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(
            theme.palette.secondary.main,
            0.1
          )})`,
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: theme.palette.primary.main, 
            fontWeight: 'bold',
            fontSize: '4rem'
          }}
        >
          Build It Records
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, color: '#FFFFFF' }}>
          House Music For The Underground
        </Typography>
      </Box>

      {/* Our Story Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Story
        </Typography>
        <Typography paragraph>
          Founded in 2015, Build It Records has been a driving force in underground electronic music,
          dedicated to curating forward-thinking sounds and nurturing top-tier talent. Our journey began
          with our first release on March 3rd, 2015, marking the start of a movement that continues to
          grow.
        </Typography>
        <Typography paragraph>
          As the parent label of Build It Deep and Build It Tech, we embrace a wide spectrum of
          underground music, from hypnotic deep house to peak-time techno. We don't just release
          music—we shape the future of the underground scene.
        </Typography>
      </Box>
    </Container>
  );
};

export default RecordsPage;