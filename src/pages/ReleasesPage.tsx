import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, Pagination } from '@mui/material';
import { LoadingSpinner, ErrorMessage, ReleaseCard } from '../components';
import { useReleases } from '../hooks/useReleases';
import { RECORD_LABELS } from '../constants/labels';
import { useParams, useLocation } from 'react-router-dom';

const ITEMS_PER_PAGE = 20;

interface ReleasesPageProps {
  label?: string;
}

const getLabelFromPath = (pathname: string): string => {
  const path = pathname.split('/')[1]; // Get 'records', 'tech', or 'deep'
  return `buildit-${path}`;
};

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label: propLabel }) => {
  const [page, setPage] = useState(1);
  const location = useLocation();
  const labelFromPath = getLabelFromPath(location.pathname);
  const labelId = propLabel || labelFromPath;
  const { releases = [], loading, error } = useReleases({ label: labelId });

  console.log('Releases in component:', releases);
  console.log('Releases type:', typeof releases);
  console.log('Is array?', Array.isArray(releases));

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Ensure releases is always an array before slicing
  const releasesArray = Array.isArray(releases) ? releases : [];
  const paginatedReleases = releasesArray.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (releasesArray.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            No Releases Found
          </Typography>
          <Typography>
            There are currently no releases available for this label.
          </Typography>
        </Box>
      </Container>
    );
  }

  const labelDisplayName = RECORD_LABELS[labelId]?.displayName || '';

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {labelDisplayName} Releases
        </Typography>
        <Grid container spacing={4}>
          {paginatedReleases.map((release) => (
            <Grid item xs={12} sm={6} md={4} key={release.id}>
              <ReleaseCard release={release} />
            </Grid>
          ))}
        </Grid>
        {releasesArray.length > ITEMS_PER_PAGE && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(releasesArray.length / ITEMS_PER_PAGE)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ReleasesPage;
