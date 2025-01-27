import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { RecordLabel } from '../../constants/labels';
import { Track } from '../../types/track';
import TrackList from '../../components/TrackList';
import PageLayout from '../../components/PageLayout';
import { useReleases } from '../../hooks/useReleases';
import { Album } from '../../types/release';

interface Release extends Album {
  title: string;
  releaseDate: string;
  artist: {
    name: string;
    imageUrl?: string;
    spotifyUrl?: string;
  };
  artworkUrl?: string;
}

interface RecordsHomeProps {
  labelId?: string;
}

const RecordsHome: React.FC<RecordsHomeProps> = ({ labelId: propLabelId }) => {
  const [mainTrack, setMainTrack] = useState<Release | null>(null);
  const [otherVersions, setOtherVersions] = useState<Release[]>([]);
  const { releases, loading, error, retryFetch, canRetry } = useReleases({ label: 'records' });

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      if (!releases || releases.length === 0) return;
      
      // Sort releases by date (newest first)
      const sortedReleases = [...releases].sort((a, b) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );

      // Convert Album to Release type
      const convertToRelease = (album: Album): Release => ({
        ...album,
        title: album.name,
        releaseDate: album.release_date,
        artworkUrl: album.images[0]?.url,
        artist: {
          name: album.artists[0]?.name || 'Unknown Artist',
          imageUrl: album.images[0]?.url,
          spotifyUrl: album.external_urls?.spotify
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
        <Alert 
          severity="error" 
          action={
            canRetry && (
              <Button
                color="inherit"
                size="small"
                onClick={retryFetch}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
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
