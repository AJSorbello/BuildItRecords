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
import { RecordLabelId } from '../../types/labels';

const AdminDashboard: React.FC = () => {
  console.log('AdminDashboard initializing');
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState<RecordLabelId>('buildit-deep');
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [totalReleases, setTotalReleases] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    console.log('AdminDashboard mounted - Checking authentication');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  const handleRefresh = async () => {
    try {
      console.log('Fetching releases and tracks for label:', selectedLabel);
      setLoading(true);
      setError(null);

      // Fetch all releases with pagination
      const response = await databaseService.getReleasesByLabelId(selectedLabel, 1, 500);
      console.log('Got releases:', response);
      
      if (response?.releases) {
        setReleases(response.releases);
        setTotalReleases(response.totalReleases);
        setCurrentPage(response.currentPage);
      }

      // Fetch all tracks sorted by created_at
      const allTracksResponse = await databaseService.getTracksByLabel(selectedLabel, 'created_at');
      console.log('Got all tracks:', allTracksResponse);
      
      setTracks(allTracksResponse.tracks);
      console.log('Set tracks state:', allTracksResponse.tracks.length, 'tracks');

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTracks = async () => {
    try {
      setImporting(true);
      setError(null);

      // Import tracks from Spotify
      const response = await databaseService.importTracksFromSpotify(selectedLabel);
      console.log('Import response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Import failed');
      }

      // Refresh the display after a short delay to allow import to process
      setTimeout(handleRefresh, 2000);
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
    setSelectedLabel(event.target.value as RecordLabelId);
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
              sx={{
                backgroundColor: '#02FF95',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#00CC76',
                },
              }}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => setImportDialogOpen(true)}
              disabled={loading || importing}
              sx={{
                color: '#FFFFFF',
                borderColor: '#FFFFFF',
                '&:hover': {
                  borderColor: '#02FF95',
                  color: '#02FF95',
                },
              }}
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
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  backgroundColor: '#2D2D2D',
                  color: '#FFFFFF',
                  height: '100%',
                  borderRadius: 2
                }}>
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
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  backgroundColor: '#2D2D2D',
                  color: '#FFFFFF',
                  height: '100%',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Artists
                    </Typography>
                    <Typography variant="h3">
                      {new Set(tracks.flatMap(track => track.artists.map(artist => artist.id))).size}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  backgroundColor: '#2D2D2D',
                  color: '#FFFFFF',
                  height: '100%',
                  borderRadius: 2
                }}>
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
            </Grid>

            <Paper sx={{ p: 3, backgroundColor: '#2D2D2D', borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mb: 3 }}>
                Latest Releases
              </Typography>
              <TrackManager tracks={tracks} />
            </Paper>
          </>
        )}
      </Box>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Tracks</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Import tracks for {RECORD_LABELS[selectedLabel]?.displayName}?
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImportTracks}
            variant="contained"
            disabled={importing}
            sx={{
              backgroundColor: '#02FF95',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#00CC76',
              },
            }}
          >
            {importing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
