import React from 'react';
import { Container, Typography, Grid, Box, Paper, Button } from '@mui/material';
import { LoadingSpinner, ErrorMessage, ReleaseCard } from '../components';
import TopReleases from '../components/TopReleases';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useReleases } from '../hooks/useReleases';
import { RECORD_LABELS } from '../constants/labels';
import { Release } from '../types/release';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ReleasesPageProps {
  label: string;
}

// Map route labels to RECORD_LABELS keys
const getLabelId = (label: string): string => {
  const labelMap: { [key: string]: string } = {
    'records': 'buildit-records',
    'tech': 'buildit-tech',
    'deep': 'buildit-deep'
  };
  return labelMap[label] || label;
};

// Validate a release object
const isValidRelease = (release: any): release is Release =>
  typeof release === 'object' &&
  release !== null &&
  typeof release.title === 'string';

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
  const mappedLabelId = getLabelId(label);
  const labelConfig = RECORD_LABELS[mappedLabelId];

  if (!labelConfig) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid label: {label}
        </Typography>
      </Box>
    );
  }

  const { loading, error, releases, refetch, hasMore, loadMore, totalReleases } = useReleases(labelConfig.id);

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
          No releases found for {labelConfig.displayName}
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
            {labelConfig.displayName} Releases
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {latestRelease && (
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Latest Release
              </Typography>
              <Paper elevation={3} sx={{ p: 2 }}>
                <ReleaseSection release={latestRelease} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <TopReleases label={labelConfig} />
            </Grid>
          </Grid>
        )}

        <Typography variant="h5" sx={{ mb: 2 }}>
          All Releases
        </Typography>
        <Grid container spacing={4}>
          {validReleases.map((release) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
              <ReleaseSection release={release} />
            </Grid>
          ))}
        </Grid>
        
        {hasMore && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={loadMore}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size={20} sx={{ mr: 1 }} />
                  Loading more releases...
                </>
              ) : (
                `Load More (${validReleases.length}/${totalReleases})`
              )}
            </Button>
          </Box>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default ReleasesPage;
