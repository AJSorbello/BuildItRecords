import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import ReleaseCard from '../../components/ReleaseCard';
import { RECORD_LABELS } from '../../constants/labels';
import { databaseService } from '../../services/DatabaseService';
import type { Release } from '../../types';

const TechHome: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const fetchedReleases = await databaseService.getReleasesForLabel('buildit-tech');
        setReleases(fetchedReleases);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch releases'));
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
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
          Latest Releases
        </Typography>
        <Grid container spacing={3}>
          {releases.map((release) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
              <ReleaseCard release={release} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default TechHome;
