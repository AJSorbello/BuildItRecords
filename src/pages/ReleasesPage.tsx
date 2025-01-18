import React from 'react';
import { Container, Typography, Grid, Box, Paper, Button } from '@mui/material';
import { LoadingSpinner, ErrorMessage, ReleaseCard } from '../components';
import TopReleases from '../components/TopReleases';
import ErrorBoundary from '../components/ErrorBoundary';
import { useReleases } from '../hooks/useReleases';
import { RECORD_LABELS } from '../constants/labels';
import { Release } from '../types/release';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ReleasesPageProps {
  label: keyof typeof RECORD_LABELS;
}

// Validate a release object
const isValidRelease = (release: any): release is Release => {
  if (!release || typeof release !== 'object') {
    console.error('Invalid release object:', release);
    return false;
  }

  const hasRequiredProps = 
    'id' in release && 
    'name' in release && 
    typeof release.id === 'string' && 
    typeof release.name === 'string';

  if (!hasRequiredProps) {
    console.error('Release missing required properties:', release);
    return false;
  }

  // Initialize optional properties with default values
  release.artists = Array.isArray(release.artists) ? release.artists : [];
  release.tracks = Array.isArray(release.tracks) ? release.tracks : [];
  release.images = Array.isArray(release.images) ? release.images : [];
  release.external_urls = release.external_urls || {};
  release.artwork_url = release.artwork_url || release.images?.[0]?.url || null;
  release.release_date = release.release_date || null;

  return true;
};

interface ReleaseSectionProps {
  release: Release | null;
}

const ReleaseSection: React.FC<ReleaseSectionProps> = ({ release }) => {
  if (!release || !isValidRelease(release)) {
    console.error('Invalid release passed to ReleaseSection:', release);
    return null;
  }

  return (
    <ReleaseCard release={release} />
  );
};

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const labelId = RECORD_LABELS[label]?.id;
  const { loading, error, releases, refetch } = useReleases(labelId);
  const labelDisplayName = RECORD_LABELS[label]?.displayName || 'Releases';

  if (!labelId) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid label
        </Typography>
      </Box>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!Array.isArray(releases)) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid releases data
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refetch}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // Validate releases
  const validReleases = releases.filter(isValidRelease);

  if (validReleases.length === 0) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          No releases found
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refetch}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  const latestRelease = validReleases[0];

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ mt: 8, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {labelDisplayName}
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Featured Latest Release and Top 10 */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {/* Featured Latest Release */}
          <Grid item xs={12} md={7}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Latest Release
              </Typography>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <ReleaseSection release={latestRelease} />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Typography variant="h4" gutterBottom>
                      {latestRelease.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {latestRelease.artists?.map(artist => artist?.name || '').filter(Boolean).join(', ')}
                    </Typography>
                    {latestRelease.release_date && (
                      <Typography variant="body1">
                        Release Date: {new Date(latestRelease.release_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Grid>

          {/* Top Releases */}
          <Grid item xs={12} md={5}>
            <ErrorBoundary>
              <TopReleases label={RECORD_LABELS[label]} />
            </ErrorBoundary>
          </Grid>
        </Grid>

        {/* Past Releases */}
        {validReleases.length > 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Past Releases
            </Typography>
            <Grid container spacing={3}>
              {validReleases.slice(1).map((release) => (
                <Grid item xs={12} sm={6} md={3} key={release.id}>
                  <ReleaseSection release={release} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default ReleasesPage;
