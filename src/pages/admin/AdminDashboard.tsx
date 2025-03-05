import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
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
  SelectChangeEvent,
  Stack,
  Avatar,
  Snackbar
} from '@mui/material';
import { databaseService } from '../../services/DatabaseService';
import { RECORD_LABELS } from '../../constants/labels';
import { Track } from '../../types/track';
import { Release } from '../../types/release';
import { RecordLabelId } from '../../types/labels';

interface AdminDashboardState {
  isAuthenticated: boolean;
  selectedLabel: RecordLabelId;
  releases: Release[];
  tracks: Track[];
  totalReleases: number;
  totalTracks: number;
  currentPage: number;
  loading: boolean;
  importing: boolean;
  error: string | null;
  importDialogOpen: boolean;
  snackbarOpen: boolean;
  snackbarMessage: string;
}

class AdminDashboard extends Component<{}, AdminDashboardState> {
  constructor(props: {}) {
    super(props);
    
    console.log('AdminDashboard initializing');
    
    this.state = {
      isAuthenticated: true, // Will be verified in componentDidMount
      selectedLabel: 'buildit-deep',
      releases: [],
      tracks: [],
      totalReleases: 0,
      totalTracks: 0,
      currentPage: 1,
      loading: false,
      importing: false,
      error: null,
      importDialogOpen: false,
      snackbarOpen: false,
      snackbarMessage: '',
    };
    
    // Bind methods
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleImportTracks = this.handleImportTracks.bind(this);
    this.handleLabelChange = this.handleLabelChange.bind(this);
    this.handleSnackbarClose = this.handleSnackbarClose.bind(this);
  }
  
  componentDidMount() {
    console.log('AdminDashboard mounted - Checking authentication');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No token found, setting isAuthenticated to false');
      this.setState({ isAuthenticated: false });
      return;
    }
    
    this.handleRefresh();
  }
  
  async handleRefresh() {
    try {
      const { selectedLabel } = this.state;
      console.log('Fetching releases and tracks for label:', selectedLabel);
      this.setState({ loading: true, error: null });

      // Fetch all releases without pagination
      const response = await databaseService.getReleasesByLabelId(selectedLabel);
      console.log('Got releases:', response);
      
      if (response?.releases) {
        this.setState({
          releases: response.releases,
          totalReleases: response.totalReleases,
          totalTracks: response.totalTracks
        });
      }

      // Fetch all tracks sorted by created_at
      const allTracksResponse = await databaseService.getTracksByLabel(selectedLabel, 'created_at');
      console.log('Got all tracks:', allTracksResponse);
      
      this.setState({ tracks: allTracksResponse.tracks });
      console.log('Set tracks state:', allTracksResponse.tracks.length, 'tracks');

    } catch (error) {
      console.error('Error fetching data:', error);
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      });
    } finally {
      this.setState({ loading: false });
    }
  }
  
  componentDidUpdate(prevProps: {}, prevState: AdminDashboardState) {
    if (prevState.selectedLabel !== this.state.selectedLabel) {
      console.log('Selected label changed:', this.state.selectedLabel);
      this.handleRefresh();
    }
  }

  async handleImportTracks() {
    try {
      const { selectedLabel } = this.state;
      this.setState({ importing: true, error: null });

      // Import tracks from Spotify
      const response = await databaseService.importTracksFromSpotify(selectedLabel);
      console.log('Import response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Import failed');
      }

      // Show success message with details
      const details = response.details || {};
      const message = `Import successful! Imported ${details.totalTracksImported || 0} tracks, ${details.totalArtistsImported || 0} artists, and ${details.totalReleasesImported || 0} releases.`;
      
      this.setState({
        snackbarOpen: true,
        snackbarMessage: message,
        importDialogOpen: false
      });

      // Refresh the display after import
      this.handleRefresh();
    } catch (error) {
      console.error('Error importing tracks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import tracks';
      this.setState({
        error: errorMessage,
        snackbarOpen: true,
        snackbarMessage: errorMessage
      });
    } finally {
      this.setState({ importing: false });
    }
  }

  handleLabelChange(event: SelectChangeEvent<string>) {
    this.setState({ selectedLabel: event.target.value as RecordLabelId });
  }
  
  handleSnackbarClose() {
    this.setState({ snackbarOpen: false });
  }

  // Helper function to format duration
  formatDuration(ms: number | undefined): string {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Helper function to format release type
  formatReleaseType(type: string | undefined): string {
    if (!type) return 'Single';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  // Helper function to get release type color
  getReleaseTypeColor(type: string | undefined): string {
    switch (type?.toLowerCase()) {
      case 'album':
        return '#02FF95';
      case 'ep':
        return '#00CC76';
      case 'compilation':
        return '#008B51';
      default: // single
        return '#02FF95';
    }
  }

  // Calculate total duration for a release
  getReleaseDuration(release: Release): number {
    return release.tracks?.reduce((total, track) => total + (track.duration_ms || 0), 0) || 0;
  }

  render() {
    const {
      isAuthenticated,
      selectedLabel,
      releases,
      tracks,
      totalReleases,
      totalTracks,
      loading,
      importing,
      error,
      importDialogOpen,
      snackbarOpen,
      snackbarMessage,
    } = this.state;
    
    if (!isAuthenticated) {
      return <Navigate to="/admin/login" replace />;
    }
    
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
                  onChange={this.handleLabelChange}
                >
                  {Object.entries(RECORD_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={this.handleRefresh}
                disabled={loading}
                sx={{
                  backgroundColor: '#02FF95',
                  color: '#000000',
                  '&:hover': {
                    backgroundColor: '#00CC76',
                  },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading...
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => this.setState({ importDialogOpen: true })}
                sx={{
                  borderColor: '#02FF95',
                  color: '#02FF95',
                  '&:hover': {
                    borderColor: '#00CC76',
                    backgroundColor: 'rgba(2, 255, 149, 0.1)',
                  },
                }}
              >
                Import Tracks
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          <Typography variant="h4" gutterBottom>
            {RECORD_LABELS[selectedLabel]?.displayName} Dashboard
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Statistics
                  </Typography>
                  <Typography variant="body1">
                    Total Releases: {totalReleases}
                  </Typography>
                  <Typography variant="body1">
                    Total Tracks: {totalTracks}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tracks.length > 0
                      ? `Last track added: ${tracks[0]?.title} by ${tracks[0]?.artists?.[0]?.name}`
                      : 'No recent activity'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Recent Releases
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : releases.length > 0 ? (
                  releases.slice(0, 5).map((release) => (
                    <Card key={release.id} sx={{ mb: 2, bgcolor: 'background.paper' }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            {release.artwork_url && (
                              <Box
                                component="img"
                                src={release.artwork_url}
                                alt={release.title}
                                sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
                              />
                            )}
                          </Grid>
                          <Grid item xs={12} sm={9}>
                            <Typography variant="h6">{release.title}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              {release.artists && release.artists.map((artist, index) => (
                                <Stack key={artist.id} direction="row" spacing={1} alignItems="center">
                                  {artist.profile_image_url && (
                                    <Avatar
                                      src={artist.profile_image_url}
                                      alt={artist.name}
                                      sx={{ width: 30, height: 30 }}
                                    />
                                  )}
                                  <Typography>
                                    {artist.name}
                                    {index < release.artists.length - 1 ? ',' : ''}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {release.release_date ? new Date(release.release_date).toLocaleDateString() : 'No date'}
                              {' • '}
                              {this.formatReleaseType(release.release_type)}
                              {' • '}
                              {this.formatDuration(this.getReleaseDuration(release))}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No releases found
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Recent Tracks
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : tracks.length > 0 ? (
                  tracks.slice(0, 10).map((track) => (
                    <Box
                      key={track.id}
                      sx={{
                        p: 1,
                        mb: 1,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={track.artwork_url || track.release?.artwork_url}
                        alt={track.title}
                        sx={{ width: 40, height: 40, mr: 2, objectFit: 'cover' }}
                      />
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography noWrap variant="body1">
                          {track.title}
                        </Typography>
                        <Typography noWrap variant="body2" color="text.secondary">
                          {track.artists?.map((a) => a.name).join(', ')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {this.formatDuration(track.duration_ms)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No tracks found
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Dialog
            open={importDialogOpen}
            onClose={() => this.setState({ importDialogOpen: false })}
            aria-labelledby="import-dialog-title"
          >
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
              <Button onClick={() => this.setState({ importDialogOpen: false })}>Cancel</Button>
              <Button
                onClick={this.handleImportTracks}
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
          
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={this.handleSnackbarClose}
            message={snackbarMessage}
          />
        </Box>
      </Container>
    );
  }
}

export default AdminDashboard;
