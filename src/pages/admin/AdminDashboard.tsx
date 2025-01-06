import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonGroup, Typography, CircularProgress, Paper } from '@mui/material';
import { API_URL, LABELS, LabelId } from '../../config';
import TrackManager from '../../components/admin/TrackManager';
import { Release, ReleasesResponse } from '../../types';

const AdminDashboard: React.FC = () => {
  const [selectedLabel, setSelectedLabel] = useState<LabelId>('buildit-records');
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalReleases, setTotalReleases] = useState(0);

  useEffect(() => {
    if (selectedLabel) {
      fetchReleases(selectedLabel);
    }
  }, [selectedLabel]);

  const handleLabelSelect = (labelId: LabelId) => {
    setSelectedLabel(labelId);
    setError(null);
  };

  const handleImport = async () => {
    if (!selectedLabel) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/admin/import-releases/${selectedLabel}`, {
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

  const fetchReleases = async (labelId: LabelId) => {
    try {
      const response = await fetch(`${API_URL}/releases/${labelId}`);
      const data: ReleasesResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch releases');
      }

      setReleases(data.releases);
      setTotalReleases(data.totalReleases);
    } catch (error) {
      console.error('Error fetching releases:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch releases');
      setReleases([]);
      setTotalReleases(0);
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

      <ButtonGroup variant="contained" sx={{ mb: 3 }}>
        {LABELS.map(label => (
          <Button
            key={label.id}
            onClick={() => handleLabelSelect(label.id)}
            variant={selectedLabel === label.id ? 'contained' : 'outlined'}
          >
            {label.displayName}
          </Button>
        ))}
      </ButtonGroup>

      <Button
        variant="contained"
        color="primary"
        onClick={handleImport}
        disabled={loading}
        sx={{ mb: 3, ml: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Import Releases'}
      </Button>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 3, bgcolor: '#1e1e1e' }}>
        <TrackManager
          selectedLabel={selectedLabel}
          onLabelChange={handleLabelSelect}
          releases={releases}
        />
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
