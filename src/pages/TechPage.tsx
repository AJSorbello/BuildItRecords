import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { ReleaseCard, LoadingSpinner, ErrorMessage } from '../components';
import { spotifyService } from '../services/SpotifyService';
import { Track } from '../types/track';
import { RECORD_LABELS } from '../types/labels';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import TechSidebar from '../components/TechSidebar';

const TechPage = () => {
  const [releases, setReleases] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const tracks = await spotifyService.getTracksByLabel(RECORD_LABELS.TECH);
        setReleases(tracks);
        setError(null);
      } catch (err) {
        console.error('Error fetching tech releases:', err);
        setError('Failed to load releases. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <PageLayout label="tech">
      <Box sx={{ display: 'flex' }}>
        <TechSidebar variant="permanent" />
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: colors.text }}>
                Build It Tech Releases
              </Typography>

              <Grid container spacing={3}>
                {releases.map((track) => (
                  <Grid item xs={12} sm={6} md={4} key={track.id}>
                    <ReleaseCard track={track} />
                  </Grid>
                ))}
                {releases.length === 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No releases found.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Container>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default TechPage;
