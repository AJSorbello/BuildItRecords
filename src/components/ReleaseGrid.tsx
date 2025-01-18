import React from 'react';
import { Grid } from '@mui/material';
import ReleaseCard from './ReleaseCard';
import { Track } from '../types/track';

interface ReleaseGridProps {
  releases: Track[];
  onReleaseClick?: (release: Track) => void;
}

const ReleaseGrid: React.FC<ReleaseGridProps> = ({ releases, onReleaseClick }) => {
  // Skip the first release since it's shown in FeaturedRelease
  const remainingReleases = releases.slice(1);
  
  return (
    <Grid container spacing={3}>
      {remainingReleases.map((release) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
          <ReleaseCard 
            release={release}
            onClick={() => onReleaseClick?.(release)}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ReleaseGrid;
