import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { databaseService } from '../../services/DatabaseService';
import { RECORD_LABELS } from '../../constants/labels';
import { Release, Track, PaginatedResponse } from '../../types/models';
import TrackManager from '../../components/admin/TrackManager';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SymphonicService from '../../services/SymphonicService';
import RefreshIcon from '@mui/icons-material/Refresh';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState('buildit-deep');
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [totalReleases, setTotalReleases] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const result = await databaseService.verifyAdminToken();
        if (!result.verified) {
          console.error('Token verification failed:', result);
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    };

    verifyAuth();
  }, [navigate]);

  useEffect(() => {
    if (selectedLabel) {
      handleRefresh();
    }
  }, [selectedLabel]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const [releasesResponse, tracksResponse] = await Promise.all([
        databaseService.getReleasesByLabelId(selectedLabel),
        databaseService.getTracks(selectedLabel)
      ]);

      // Handle releases
      if (releasesResponse && 'items' in releasesResponse) {
        setReleases(releasesResponse.items);
        setTotalReleases(releasesResponse.total);
      }
      
      // Handle tracks
      if (Array.isArray(tracksResponse)) {
        setTracks(tracksResponse.map(track => ({
          ...track,
          type: 'track',
          artists: Array.isArray(track.artists) ? track.artists : [],
          release: Array.isArray(track.release) ? track.release : []
        })));
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      const importedTracks = await databaseService.importTracksByLabel(selectedLabel);
      
      // Update tracks state with imported tracks
      if (Array.isArray(importedTracks)) {
        setTracks(importedTracks.map(track => ({
          ...track,
          type: 'track',
          artists: Array.isArray(track.artists) ? track.artists : [],
          release: Array.isArray(track.release) ? track.release : []
        })));
      }
      
      setSnackbar({
        open: true,
        message: 'Successfully imported tracks',
        severity: 'success'
      });
    } catch (error: unknown) {
      console.error('Import error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to import tracks',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear existing releases from localStorage
      localStorage.removeItem('releases');
      localStorage.removeItem('lastSyncTimestamp');
      
      // Create new SymphonicService instance and sync
      const symphonicService = new SymphonicService(process.env.REACT_APP_SYMPHONIC_API_KEY || '');
      await symphonicService.syncReleases();
      
      // Refresh the dashboard
      await handleRefresh();
      
      setSnackbar({ 
        open: true, 
        message: 'Successfully synced releases', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error syncing releases:', error);
      setError('Failed to sync releases. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to sync releases',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleRefresh}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={handleSync}
            disabled={loading}
            startIcon={<CloudUploadIcon />}
            color="secondary"
          >
            Sync Releases
          </Button>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel>Select Label</InputLabel>
                <Select
                  value={selectedLabel}
                  onChange={(e) => setSelectedLabel(e.target.value)}
                >
                  {Object.entries(RECORD_LABELS).map(([id, label]) => (
                    <MenuItem key={id} value={id}>
                      {label.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleImport}
                disabled={loading}
                fullWidth
              >
                Import Tracks
              </Button>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Releases
                    </Typography>
                    <Typography variant="h3">
                      {totalReleases}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Tracks
                    </Typography>
                    <Typography variant="h3">
                      {tracks.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Artists
                    </Typography>
                    <Typography variant="h3">
                      {tracks ? new Set(
                        tracks
                          .filter(track => track?.artists)
                          .flatMap(track => 
                            track.artists
                              ?.filter(artist => artist && artist.id)
                              .map(artist => artist.id)
                          )
                      ).size : 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Track Management
              </Typography>
              <TrackManager 
                labelId={selectedLabel}
                tracks={tracks}
                onEdit={handleRefresh}
                onDelete={handleRefresh}
              />
            </Box>
          </>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          message={snackbar.message}
        />
      </Box>
    </Container>
  );
};

export default AdminDashboard;
