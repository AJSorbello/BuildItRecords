import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Pagination
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
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
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

  const handleLabelSelect = async (labelId: string, page: number = 1) => {
    setSelectedLabel(labelId);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/releases/${labelId}?page=${page}&limit=10`, {
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
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
      setReleases([]);
      setTotalReleases(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (selectedLabel) {
      handleLabelSelect(selectedLabel, page);
    }
  };

  const handleImportReleases = async (labelId: string) => {
    setImporting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/releases/${labelId}/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to import releases: ${response.statusText}`);
      }

      const data = await response.json();
      
      // After import, refresh the releases list
      await handleLabelSelect(labelId, 1);
      
    } catch (err) {
      console.error('Error importing releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to import releases');
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const fetchReleases = async () => {
    if (selectedLabel) {
      await handleLabelSelect(selectedLabel, currentPage);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {Object.values(RECORD_LABELS).map((label) => (
          <Button
            key={label.id}
            variant={selectedLabel === label.id ? 'contained' : 'outlined'}
            onClick={() => handleLabelSelect(label.id, 1)}
            disabled={loading || importing}
          >
            {label.displayName}
          </Button>
        ))}
      </Box>

      {selectedLabel && (
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleImportReleases(selectedLabel)}
            disabled={loading || importing}
            sx={{ mb: 2 }}
          >
            {importing ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Importing...
              </>
            ) : (
              'Import Releases'
            )}
          </Button>

          {(loading || importing) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <TrackManager
                selectedLabel={selectedLabel}
                releases={releases}
                totalReleases={totalReleases}
                onRefresh={() => handleLabelSelect(selectedLabel, currentPage)}
              />
              {totalReleases > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination 
                    count={Math.ceil(totalReleases / 10)} 
                    page={currentPage} 
                    onChange={(event, page) => handleLabelSelect(selectedLabel, page)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AdminDashboard;
