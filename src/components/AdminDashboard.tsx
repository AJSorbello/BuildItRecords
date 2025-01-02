import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonGroup, Typography, CircularProgress, Grid, Paper } from '@mui/material';
import { API_URL } from '../config';
import TrackManager from './TrackManager';

interface Release {
  id: string;
  name: string;
  artist_id: string;
  artist_name: string;
  release_date: string;
  spotify_url: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
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
      setReleases(data.data || []);
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
              color="primary"
              onClick={handleImport}
              disabled={loading}
              sx={{ mb: 2, display: 'block' }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Import Releases'
              )}
            </Button>

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mt: 2 }}>
              Total Releases: {releases.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: '#1e1e1e' }}>
            <Typography variant="h6" gutterBottom>
              Track Management
            </Typography>
            <TrackManager selectedLabel={selectedLabel} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
