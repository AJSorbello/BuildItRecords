import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonGroup, Typography, CircularProgress, Grid, Paper, img } from '@mui/material';
import { API_URL } from '../config';
import TrackManager from './TrackManager';

interface Release {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistImage: string;
  releaseDate: string;
  coverImage: string;
  spotifyUrl: string;
  tracks: Array<{
    id: string;
    title: string;
    remixer: {
      id: string;
      name: string;
      image: string;
    } | null;
    duration: number;
    spotifyUrl: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [selectedLabel, setSelectedLabel] = useState<string>('buildit-records');
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLabel) {
      fetchReleases(selectedLabel);
    }
  }, [selectedLabel]);

  const handleLabelSelect = (labelId: string) => {
    setSelectedLabel(labelId);
    setError(null);
  };

  const handleImport = async () => {
    if (!selectedLabel) return;
    setLoading(true);
    setError(null);

    try {
      console.log('Importing releases for label:', selectedLabel);
      const response = await fetch(`${API_URL}/import-releases/${selectedLabel}`, {
        method: 'GET',
      });

      console.log('Import response:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import releases');
      }

      console.log('Import successful:', data);
      await fetchReleases(selectedLabel);
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import releases');
    } finally {
      setLoading(false);
    }
  };

  const fetchReleases = async (labelId: string) => {
    try {
      console.log('Fetching releases for label:', labelId);
      const response = await fetch(`${API_URL}/releases/${labelId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch releases');
      }

      console.log('Received releases:', data);
      setReleases(data.releases || []);
    } catch (error) {
      console.error('Error fetching releases:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch releases');
      setReleases([]);
    }
  };

  return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#fff'
    }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e1e1e' }}>
            <Typography variant="h6" gutterBottom>
              Import Releases
            </Typography>
            
            <ButtonGroup variant="contained" sx={{ mb: 2 }}>
              <Button
                onClick={() => handleLabelSelect('buildit-records')}
                color={selectedLabel === 'buildit-records' ? 'primary' : 'inherit'}
              >
                Build It Records
              </Button>
              <Button
                onClick={() => handleLabelSelect('buildit-tech')}
                color={selectedLabel === 'buildit-tech' ? 'primary' : 'inherit'}
              >
                Build It Tech
              </Button>
              <Button
                onClick={() => handleLabelSelect('buildit-deep')}
                color={selectedLabel === 'buildit-deep' ? 'primary' : 'inherit'}
              >
                Build It Deep
              </Button>
            </ButtonGroup>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleImport}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Import Releases'}
            </Button>

            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Typography variant="subtitle1" gutterBottom>
              Total Releases: {releases.length}
            </Typography>

            {releases.map((release) => (
              <Paper key={release.id} sx={{ p: 2, mb: 2, bgcolor: '#1e1e1e' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    {release.coverImage && (
                      <img
                        src={release.coverImage}
                        alt={release.title}
                        style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={9}>
                    <Typography variant="h6">{release.title}</Typography>
                    <Typography variant="subtitle1">
                      Artist: {release.artist}
                    </Typography>
                    <Typography variant="body2">
                      Release Date: {new Date(release.releaseDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      Tracks: {release.tracks.length}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {release.tracks.map((track) => (
                        <Typography key={track.id} variant="body2" sx={{ mb: 1 }}>
                          • {track.title}
                          {track.remixer && ` (${track.remixer.name} Remix)`}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TrackManager />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
