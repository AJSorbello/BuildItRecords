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
  Grid,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent
} from '@mui/material';
import TrackManager from '../../components/admin/TrackManager';
import { databaseService } from '../../services/DatabaseService';
import { RECORD_LABELS } from '../../constants/labels';
import { Track } from '../../types/track';
import { Release } from '../../types/release';
import { RecordLabel } from '../../types/labels';

const AdminDashboard: React.FC = () => {
  console.log('AdminDashboard initializing');
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState<string>('buildit-deep');
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [totalReleases, setTotalReleases] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importLabel, setImportLabel] = useState<string>('buildit-deep');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    console.log('AdminDashboard mounted - Checking authentication');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/admin/login');
      return;
    }
  }, []);

  const handleRefresh = async () => {
    try {
      console.log('Fetching releases and tracks for label:', selectedLabel);
      setLoading(true);
      setError(null);

      // Fetch regular releases
      const response = await databaseService.getReleasesByLabelId(selectedLabel);
      console.log('Got releases:', response);
      
      if (response?.releases) {
        setReleases(response.releases);
        setTotalReleases(response.totalReleases);
        setCurrentPage(response.currentPage);
      }

      // Fetch all tracks for the label
      const recordLabel = RECORD_LABELS[selectedLabel];
      if (recordLabel) {
        // Fetch regular tracks sorted by created_at
        const allTracks = await databaseService.getTracksByLabel(recordLabel, 'created_at');
        console.log('Got all tracks:', allTracks);
        if (Array.isArray(allTracks)) {
          setTracks(allTracks);
          console.log('Set tracks state:', allTracks.length, 'tracks');
        }

        // Fetch top tracks by popularity
        const popularTracks = await databaseService.getTracksByLabel(recordLabel, 'popularity');
        console.log('Got popular tracks:', popularTracks);
        if (Array.isArray(popularTracks)) {
          setTopTracks(popularTracks.slice(0, 10));
          console.log('Set top tracks state:', popularTracks.slice(0, 10).length, 'tracks');
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTracks = async () => {
    if (!importLabel) {
      setError('Please select a label to import');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const label = RECORD_LABELS[importLabel];
      if (!label) {
        throw new Error('Invalid label selected');
      }

      // Import tracks from Spotify
      const response = await databaseService.getTracksByLabel(label);
      console.log('Got tracks to import:', response);

      if (Array.isArray(response)) {
        await databaseService.saveTracks(response);
        console.log('Successfully imported tracks');
      }
      
      // Refresh the display
      await handleRefresh();
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing tracks:', error);
      setError(error instanceof Error ? error.message : 'Failed to import tracks');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    console.log('Selected label changed:', selectedLabel);
    if (selectedLabel) {
      handleRefresh();
    }
  }, [selectedLabel]);

  const handleLabelChange = (event: SelectChangeEvent<string>) => {
    setSelectedLabel(event.target.value);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Grid item>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Label</InputLabel>
              <Select
                value={selectedLabel}
                label="Label"
                onChange={handleLabelChange}
              >
                {Object.entries(RECORD_LABELS).map(([id, label]) => (
                  <MenuItem key={id} value={id}>
                    {label.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => setImportDialogOpen(true)}
              disabled={loading || importing}
            >
              Import Tracks
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {topTracks?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Top 10 Tracks by Popularity
                </Typography>
                <TrackManager tracks={topTracks} />
              </Box>
            )}

            <Box>
              <Typography variant="h5" gutterBottom>
                Latest Releases
              </Typography>
              <TrackManager tracks={tracks} />
            </Box>
          </>
        )}
      </Box>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Tracks</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Label</InputLabel>
            <Select
              value={importLabel}
              label="Label"
              onChange={(e) => setImportLabel(e.target.value)}
            >
              {Object.entries(RECORD_LABELS).map(([id, label]) => (
                <MenuItem key={id} value={id}>
                  {label.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImportTracks}
            variant="contained"
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
