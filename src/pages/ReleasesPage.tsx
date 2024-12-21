import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, Pagination } from '@mui/material';
import { Release } from '../types/release';
import { LoadingSpinner, ErrorMessage } from '../components';
import ReleaseCard from '../components/ReleaseCard';
import { useReleases } from '../hooks/useReleases';
import { RECORD_LABELS } from '../constants/labels';
import { useParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 20;

export interface ReleasesPageProps {
  label: 'records' | 'tech' | 'deep';
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const [page, setPage] = useState(1);
  const { releases, loading, error } = useReleases({ label });

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const paginatedReleases = releases.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {RECORD_LABELS[label]} Releases
        </Typography>
        <Grid container spacing={4}>
          {paginatedReleases.map((release) => (
            <Grid item xs={12} sm={6} md={4} key={release.id}>
              <ReleaseCard release={release} />
            </Grid>
          ))}
        </Grid>
        {releases.length > ITEMS_PER_PAGE && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(releases.length / ITEMS_PER_PAGE)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ReleasesPage;
