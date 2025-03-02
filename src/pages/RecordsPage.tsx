import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(
            theme.palette.secondary.main,
            0.1
          )})`,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Build It Records
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Where Underground House Music Thrives
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

      {/* Our Labels Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Labels
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )})`,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Build It Deep
              </Typography>
              <Typography>
                A sanctuary for deep, emotive, and soulful house music. Build It Deep is where melody
                and atmosphere take center stage, delivering immersive sounds that connect on a deeper
                level.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(
                  theme.palette.secondary.main,
                  0.1
                )})`,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Build It Tech
              </Typography>
              <Typography>
                A powerhouse for cutting-edge tech house, minimal, and techno. Build It Tech is where
                high-energy grooves and intricate production meet, designed for peak-time moments on the
                dance floor.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Our Philosophy Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Our Philosophy
        </Typography>
        <Typography paragraph>
          At Build It Records, we prioritize quality over quantity. Every release is a carefully
          curated experience, ensuring that our artists receive the best platform to showcase their
          work.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Our commitment goes beyond just music:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Professional mastering to ensure top-tier sound" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Striking artwork that reflects each release's identity" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Strategic promotion to give our artists the exposure they deserve" />
          </ListItem>
        </List>
        <Typography paragraph sx={{ mt: 2 }}>
          We work closely with every artist, providing support, guidance, and a space where creativity
          flourishes.
        </Typography>
      </Box>

      {/* Looking Forward Section */}
      <Box
        sx={{
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(
            theme.palette.secondary.main,
            0.05
          )})`,
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Looking Forward
        </Typography>
        <Typography paragraph>
          With nearly a decade of releases, Build It Records continues to push boundaries while staying
          true to its underground roots. We remain focused on discovering fresh talent, fostering
          collaborations, and bringing cutting-edge sounds to the world.
        </Typography>
        <Typography>
          Through our labels, events, and community-driven projects, we are not just building a record
          label—we are shaping the next wave of electronic music culture.
        </Typography>
      </Box>
    </Container>
  );
};

export default RecordsPage;