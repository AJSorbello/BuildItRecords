import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Track } from '../types/track';
import { RecordLabel } from '../constants/labels';
import { spotifyService } from '../services/SpotifyService';
import TrackCard from './TrackCard';

interface TopReleasesProps {
  label: RecordLabel;
}

const TOP_RELEASES_LIMIT = 10;

const TopReleases: React.FC<TopReleasesProps> = ({ label }) => {
  const [topReleases, setTopReleases] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopReleases = async () => {
      try {
        setLoading(true);
        const releases = await spotifyService.getTracksByLabel(label);
        const sortedReleases = releases
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, TOP_RELEASES_LIMIT);
        setTopReleases(sortedReleases);
      } catch (error) {
        console.error('Error fetching top releases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopReleases();
  }, [label]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading top releases...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: 3,
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        Top 10 Releases
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {topReleases.map((track, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
            <TrackCard
              track={track}
              ranking={index + 1}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TopReleases;
