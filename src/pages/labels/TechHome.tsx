import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { ReleaseCard } from '../../components/ReleaseCard';
import DatabaseService from '../../services/DatabaseService';
import { Release } from '../../types/release';

const TechHome: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const response = await DatabaseService.getReleasesByLabelId('tech');
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tech Releases
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
