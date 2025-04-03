import React, { useState, useEffect } from 'react';
import { Typography, Box, Grid, Alert, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageLayout from '../../components/PageLayout';
import { useReleases } from '../../hooks/useReleases';
import { Release } from '../../types/release';

interface RecordsHomeProps {
  labelId?: string;
}

const RecordsHome: React.FC<RecordsHomeProps> = ({ labelId: propLabelId }) => {
  const [mainTrack, setMainTrack] = useState<Release | null>(null);
  const [otherVersions, setOtherVersions] = useState<Release[]>([]);
  const { releases, loading, error, refetch } = useReleases('records');

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      if (!releases || releases.length === 0) return;
      
      // Sort releases by date (newest first)
      const sortedReleases = [...releases].sort((a, b) => 
        new Date(b.release_date || '').getTime() - new Date(a.release_date || '').getTime()
      );

      // Convert to simpler format
      const convertToRelease = (release: Release): Release => ({
        ...release,
        title: release.name || release.title,
        releaseDate: release.release_date,
        artworkUrl: release.images?.[0]?.url,
        artist: {
          name: release.artists?.[0]?.name || 'Unknown Artist',
          imageUrl: release.images?.[0]?.url,
          spotifyUrl: release.external_urls?.spotify
        }
      });

      // Set main track and other versions
      if (sortedReleases.length > 0) {
        setMainTrack(convertToRelease(sortedReleases[0]));
        setOtherVersions(sortedReleases.slice(1).map(convertToRelease));
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
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6">{error}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Typography variant="body2" color="text.secondary">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Try again
                </Typography>
                <Button
                  color="inherit"
                  size="small"
                  onClick={refetch}
                >
                  Retry
                </Button>
              </Box>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <PageLayout label="records">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '900px',
          mx: 'auto',
          mt: 2,
          px: 2
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom 
          sx={{ 
            color: '#4CAF50',
            mb: 2,
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '4rem'
          }}
        >
          Build It Records
        </Typography>

        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            color: '#FFFFFF',
            mb: 6,
            textAlign: 'center'
          }}
        >
          House Music for The Underground
        </Typography>

        {mainTrack && (
          <Box sx={{ width: '100%', mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Latest Release
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  component="img"
                  src={mainTrack.artworkUrl || '/placeholder.jpg'}
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
                  {mainTrack.artist?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Released: {mainTrack.releaseDate && new Date(mainTrack.releaseDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {otherVersions.length > 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Other Releases
            </Typography>
            <Grid container spacing={3}>
              {otherVersions.map((release, index) => (
                <Grid item xs={12} sm={6} md={4} key={release.id || index}>
                  <Box
                    component="img"
                    src={release.artworkUrl || '/placeholder.jpg'}
                    alt={release.title}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="subtitle1">{release.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {release.artist?.name}
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
