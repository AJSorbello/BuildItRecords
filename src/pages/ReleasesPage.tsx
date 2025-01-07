import React, { useState } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import { LoadingSpinner, ErrorMessage, ReleaseCard } from '../components';
import { useReleases } from '../hooks/useReleases';
import { useLocation } from 'react-router-dom';
import { RECORD_LABELS } from '../constants/labels';

const ReleasesPage: React.FC = () => {
  // Get label from URL path (e.g., /records/releases -> records)
  const location = useLocation();
  const labelId = `buildit-${location.pathname.split('/')[1]}`;
  const { loading, error, releases } = useReleases({ label: labelId });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!releases?.length) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          No releases found
        </Typography>
      </Box>
    );
  }

  const label = RECORD_LABELS[labelId];
  const labelDisplayName = label?.displayName || 'Releases';

  return (
    <Container maxWidth="xl" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {labelDisplayName}
      </Typography>
      <Grid container spacing={3}>
        {releases.map((release) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
            <ReleaseCard release={release} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ReleasesPage;
