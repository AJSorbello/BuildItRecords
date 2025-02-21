import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const RecordsPage: React.FC = () => {
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
          Build It Records
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Our Story
          </Typography>
          <Typography variant="body1" paragraph>
            Build It Records was established in 2023 with a clear vision: to create a home for
            exceptional electronic music across multiple genres. As the parent company of Build It Deep
            and Build It Tech, we've cultivated a diverse ecosystem of musical talent, fostering
            creativity and innovation in electronic music production.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Our Labels
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Build It Deep
                </Typography>
                <Typography variant="body1">
                  Focused on deep, soulful house music that emphasizes emotion and atmosphere.
                  Build It Deep represents the more introspective side of our catalog, where
                  melody and mood take center stage.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Build It Tech
                </Typography>
                <Typography variant="body1">
                  Our platform for cutting-edge tech house and techno. Build It Tech showcases
                  innovative production techniques and peak-time energy, perfect for the
                  modern dance floor.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Our Philosophy
          </Typography>
          <Typography variant="body1" paragraph>
            At Build It Records, we believe in quality over quantity. Each release is carefully
            selected and curated to maintain our high standards. We work closely with our artists,
            providing them with the support and platform they need to realize their creative vision.
            Our commitment to excellence extends beyond just the music - we pride ourselves on
            professional mastering, striking artwork, and strategic promotion for every release.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main }}>
            Looking Forward
          </Typography>
          <Typography variant="body1" paragraph>
            As we continue to grow, our focus remains on discovering and nurturing talented artists
            who share our passion for quality electronic music. We're constantly exploring new
            sounds and pushing boundaries while staying true to our core values. Through our
            labels, events, and community engagement, we're building more than just a record
            company - we're creating a movement in electronic music.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RecordsPage;