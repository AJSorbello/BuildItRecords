import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { RECORD_LABELS } from '../../constants/labels';
import { Track } from '../../types/track';
import TrackList from '../../components/TrackList';
import PageLayout from '../../components/PageLayout';
import { useReleases } from '../../hooks/useReleases';

interface Release {
  id: string;
  title: string;
  imageUrl?: string;
  releaseDate: string;
  artist: {
    name: string;
    imageUrl?: string;
    spotifyUrl?: string;
  };
  spotifyUrl?: string;
}

const RecordsHome = () => {
  const [mainTrack, setMainTrack] = useState<Release | null>(null);
  const [otherVersions, setOtherVersions] = useState<Release[]>([]);
  const { releases, loading, error } = useReleases({ label: 'records' });

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      if (!releases || releases.length === 0) return;
      
      // Sort releases by date (newest first)
      const sortedReleases = [...releases].sort((a, b) => {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB.getTime() - dateA.getTime();
      });
      console.log('Sorted releases:', sortedReleases);

      // Get the latest release date
      const latestDate = sortedReleases[0]?.releaseDate;
      console.log('Latest release date:', latestDate);
      
      // Get all releases from the latest release date
      const latestReleases = sortedReleases.filter(release => 
        release.releaseDate === latestDate
      );
      console.log('Latest releases:', latestReleases);

      // Set the main track and other versions
      if (latestReleases.length > 0) {
        setMainTrack(latestReleases[0]);
        setOtherVersions(latestReleases.slice(1));
      }
    };

    fetchFeaturedTracks();
  }, [releases]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading releases...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <PageLayout label="records">
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Build It Records
        </Typography>

        {mainTrack && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Latest Release
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  component="img"
                  src={mainTrack.imageUrl || '/placeholder.jpg'}
                  alt={mainTrack.title}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={8}>
                <Typography variant="h6">{mainTrack.title}</Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {mainTrack.artist.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Released: {new Date(mainTrack.releaseDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {otherVersions.length > 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Other Versions
            </Typography>
            <Grid container spacing={3}>
              {otherVersions.map((release) => (
                <Grid item xs={12} sm={6} md={4} key={release.id}>
                  <Box
                    component="img"
                    src={release.imageUrl || '/placeholder.jpg'}
                    alt={release.title}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="subtitle1">{release.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {release.artist.name}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default RecordsHome;
