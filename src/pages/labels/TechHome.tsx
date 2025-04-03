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
        const fetchedReleases = await databaseService.getReleasesByLabelId('tech');
        setReleases(fetchedReleases.map((release: any) => ({
          ...release,
          images: release.images || [],
          release_date: release.release_date || new Date().toISOString(),
          total_tracks: release.total_tracks || 1
        })));
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
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ fontWeight: 'bold', color: '#00bfff' }}
        >
          Build It Tech
        </Typography>
        <Typography 
          variant="h5" 
          component="p" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 4,
            maxWidth: '800px',
            mx: 'auto',
            lineHeight: 1.8,
            color: '#e0e0e0'
          }}
        >
          Build It Tech delivers electrifying tech house, minimal deep tech, and driving club sounds engineered for peak energy moments. Our releases fuse infectious grooves with innovative sound design, creating dynamic productions that command attention at festivals, clubs, and beyond. With relentless rhythms and genre-defying creativity, Build It Tech represents the cutting edge of electronic music made to move dancefloors worldwide.
        </Typography>
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
