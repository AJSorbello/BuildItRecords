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
        <Typography variant="h4" component="h2" gutterBottom>
          Our Mission
        </Typography>
        <Typography paragraph>
          Build It Tech stands at the forefront of modern electronic music innovation. Launched as
          a sister label to Build It Deep, we focus on the cutting edge of tech house, techno,
          and progressive electronic music. Our mission is to push the boundaries of what&apos;s possible
          in electronic music while maintaining the highest production standards.
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Musical Identity
        </Typography>
        <Typography paragraph>
          The Build It Tech sound is characterized by driving rhythms, innovative sound design,
          and forward-thinking production techniques. We embrace both analog warmth and digital
          precision, creating a unique sonic palette that defines the modern tech house genre.
          Our releases often feature intricate percussion work, memorable hooks, and that
          essential peak-time energy that moves dance floors worldwide.
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Innovation & Technology
        </Typography>
        <Typography paragraph>
          True to our name, we&apos;re constantly exploring new technologies and production methods.
          From cutting-edge synthesizers to innovative mixing techniques, Build It Tech embraces
          the latest advancements in music technology. We encourage our artists to experiment
          with new tools and techniques, pushing the boundaries of what&apos;s possible in electronic
          music production.
        </Typography>
      </Box>

      <Box>
        <Typography variant="h4" component="h2" gutterBottom>
          Global Impact
        </Typography>
        <Typography paragraph>
          While our sound is firmly rooted in tech house, our influence extends across the
          electronic music spectrum. Our releases regularly feature in sets by leading DJs
          and receive support from major players in the industry. Through our commitment to
          innovation and quality, we&apos;ve established ourselves as a trusted source for
          forward-thinking electronic music that consistently delivers on the dance floor.
        </Typography>
      </Box>
    </Container>
  );
};

export default TechPage;
