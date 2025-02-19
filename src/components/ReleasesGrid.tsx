import React from 'react';
import {
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { ReleaseCard } from './ReleaseCard';
import { Release } from '../types/release';

interface ReleasesGridProps {
  releases: Release[];
  isLoading: boolean;
  error: Error | null;
}

const ReleasesGrid: React.FC<ReleasesGridProps> = ({ releases, isLoading, error }) => {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <Typography>Loading releases...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <Typography color="error">{error.message}</Typography>
      </Box>
    );
  }

  if (!releases.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <Typography>No releases found</Typography>
      </Box>
    );
  }

  const featuredRelease = releases[0];
  const otherReleases = releases.slice(1);

  return (
    <Grid container spacing={3}>
      {featuredRelease && (
        <Grid item xs={12}>
          <ReleaseCard release={featuredRelease} featured />
        </Grid>
      )}
      {otherReleases.map((release) => (
        <Grid item xs={12} sm={6} md={4} key={release.id}>
          <ReleaseCard release={release} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ReleasesGrid;
