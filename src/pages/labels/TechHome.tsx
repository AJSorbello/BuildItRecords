import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Alert, Paper, Divider } from '@mui/material';
import { ReleaseCard } from '../../components/ReleaseCard';
import { databaseService } from '../../services/DatabaseService';
import { Release } from '../../types/release';

const TechHome: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const response = await databaseService.getReleasesByLabelId('tech');
        if (response.data) {
          setReleases(response.data.map((release: any) => ({
            ...release,
            images: release.images || [],
            release_date: release.release_date || new Date().toISOString(),
            total_tracks: release.total_tracks || 1
          })));
        }
      } catch (err) {
        setError('Failed to fetch releases');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Build It Tech
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ fontStyle: 'italic', mb: 4 }}>
          Pushing Boundaries in Tech House
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#00bfff', fontWeight: 'bold' }}>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph>
            Build It Tech is all about redefining the sound of modern tech house. As the forward-thinking sibling of Build It Deep, we're committed to delivering music that drives the dance floor—from festivals to underground clubs. Our goal: push the genre forward with bold, high-quality releases.
          </Typography>
          
          <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#00bfff', fontWeight: 'bold' }}>
            The Sound
          </Typography>
          <Typography variant="body1" paragraph>
            Our tracks blend groovy percussion, clean hooks, and cutting-edge production. Expect a mix of peak-time energy, minimal deep tech, and touches of techno and progressive vibes—crafted for DJs who want to stand out.
          </Typography>
          
          <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#00bfff', fontWeight: 'bold' }}>
            Driven by Innovation
          </Typography>
          <Typography variant="body1" paragraph>
            We champion new sounds and technology. Whether it's analog gear or next-gen plugins, our artists explore what's next in electronic music. Build It Tech is more than a label—it's a space for experimentation and evolution.
          </Typography>
          
          <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#00bfff', fontWeight: 'bold' }}>
            Global Reach
          </Typography>
          <Typography variant="body1" paragraph>
            From club residencies to international stages, our releases make waves. Played by top DJs and embraced by tastemakers, Build It Tech is shaping the sound of tomorrow's tech house scene.
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Latest Releases
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {releases.map((release) => (
          <Grid item xs={12} sm={6} md={4} key={release.id}>
            <ReleaseCard release={release} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default TechHome;
