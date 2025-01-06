import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import TrackManager from '../../components/admin/TrackManager';
import { API_URL } from '../../config';
import { RECORD_LABELS } from '../../constants/labels';
import { Release } from '../../types';

interface ReleasesResponse {
  label: string;
  totalReleases: number;
  releases: Release[];
  error?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [releases, setReleases] = useState<Release[]>([]);
  const [totalReleases, setTotalReleases] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLabelSelect = async (labelId: string) => {
    setSelectedLabel(labelId);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/releases/${labelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`);
      }

      const data: ReleasesResponse = await response.json();
      setReleases(data.releases || []);
      setTotalReleases(data.totalReleases || 0);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
      setReleases([]);
      setTotalReleases(0);
    } finally {
      setLoading(false);
    }
  };

  const handleImportReleases = async (labelId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/import-releases/${labelId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to import releases: ${response.statusText}`);
      }

      // Refresh the releases list after import
      await handleLabelSelect(labelId);
    } catch (err) {
      console.error('Error importing releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to import releases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select Label
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {Object.values(RECORD_LABELS).map((label) => (
              <Button
                key={label.id}
                variant={selectedLabel === label.id ? 'contained' : 'outlined'}
                onClick={() => handleLabelSelect(label.id)}
              >
                {label.displayName}
              </Button>
            ))}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedLabel ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleImportReleases(selectedLabel)}
              >
                Import New Releases
              </Button>
            </Box>

            <TrackManager
              selectedLabel={selectedLabel}
              releases={releases}
              totalReleases={totalReleases}
              onRefresh={() => handleLabelSelect(selectedLabel)}
            />
          </>
        ) : (
          <Typography variant="body1">
            Please select a label to manage its releases
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
