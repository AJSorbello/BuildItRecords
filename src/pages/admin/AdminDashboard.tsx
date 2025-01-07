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
    const verifyToken = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Token verification failed');
        }
      } catch (err) {
        console.error('Token verification error:', err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    };

    verifyToken();
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
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/admin/import-releases/${labelId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to import releases: ${response.statusText}`);
      }

      // Refresh the releases list after import
      await handleLabelSelect(labelId);
    } catch (err) {
      console.error('Error importing releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to import releases');
      
      // If token is invalid, redirect to login
      if (err instanceof Error && err.message.includes('Invalid token')) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const fetchReleases = async () => {
    await handleLabelSelect(selectedLabel);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Label Management
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {Object.values(RECORD_LABELS).map((label) => (
            <Button
              key={label.id}
              variant={selectedLabel === label.id ? 'contained' : 'outlined'}
              onClick={() => handleLabelSelect(label.id)}
              disabled={loading}
            >
              {label.displayName}
            </Button>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {selectedLabel && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleImportReleases(selectedLabel)}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Import Releases'}
            </Button>

            {releases.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {totalReleases} Releases Found
                </Typography>
                <TrackManager 
                  releases={releases}
                  selectedLabel={selectedLabel}
                  totalReleases={totalReleases}
                  onRefresh={fetchReleases}
                />
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
