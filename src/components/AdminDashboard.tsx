import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonGroup, Typography, CircularProgress, Grid, Paper } from '@mui/material';
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
      const response = await fetch(`${API_URL}/import-releases/${selectedLabel}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import releases');
      }

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
      const response = await fetch(`${API_URL}/releases/${labelId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch releases');
      }

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Import Releases'}
          </Button>
          
          <Typography variant="subtitle1">
            Total Releases: {releases.length}
          </Typography>
        </Box>

        {error && (
          <Typography color="error">
            {error}
          </Typography>
        )}
      </Paper>

      <TrackManager releases={releases} selectedLabel={selectedLabel} />
    </Box>
  );
};

export default AdminDashboard;
