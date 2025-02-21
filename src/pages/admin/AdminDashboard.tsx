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
  SelectChangeEvent,
  Stack,
  Avatar,
  Snackbar
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
  const [totalTracks, setTotalTracks] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVariant, setSnackbarVariant] = useState('success');

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

      // Fetch all releases without pagination
      const response = await databaseService.getReleasesByLabelId(selectedLabel);
      console.log('Got releases:', response);
      
      if (response?.releases) {
        setReleases(response.releases);
        setTotalReleases(response.totalReleases);
        setTotalTracks(response.totalTracks);
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

  useEffect(() => {
    console.log('Selected label changed:', selectedLabel);
    if (selectedLabel) {
      handleRefresh();
    }
  }, [selectedLabel]);

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

      // Show success message with details
      const details = response.details || {};
      const message = `Import successful! Imported ${details.totalTracksImported || 0} tracks, ${details.totalArtistsImported || 0} artists, and ${details.totalReleasesImported || 0} releases.`;
      enqueueSnackbar(message, { variant: 'success' });

      // Refresh the display after import
      handleRefresh();
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing tracks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import tracks';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleLabelChange = (event: SelectChangeEvent<string>) => {
    setSelectedLabel(event.target.value as RecordLabelId);
  };

  // Helper function to format duration
  const formatDuration = (ms: number | undefined): string => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to format release type
  const formatReleaseType = (type: string | undefined): string => {
    if (!type) return 'Single';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  // Helper function to get release type color
  const getReleaseTypeColor = (type: string | undefined): string => {
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
  };

  // Calculate total duration for a release
  const getReleaseDuration = (release: Release): number => {
    return release.tracks?.reduce((total, track) => total + (track.duration_ms || 0), 0) || 0;
  };

  const ArtistCell = ({ artists }: { artists: any[] }) => {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {artists.map((artist, index) => (
          <Stack key={artist.id} direction="row" spacing={1} alignItems="center">
            {artist.image_url && (
              <Avatar
                src={artist.image_url}
                alt={artist.name}
                sx={{ width: 30, height: 30 }}
              />
            )}
            <Typography>
              {artist.name}
              {index < artists.length - 1 ? ',' : ''}
            </Typography>
          </Stack>
        ))}
      </Stack>
    );
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
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        mb: 2
                      }}
                    >
                      Total Tracks
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '3.5rem'
                      }}
                    >
                      {totalTracks}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  backgroundColor: '#2D2D2D',
                  color: '#FFFFFF',
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        mb: 2
                      }}
                    >
                      Total Artists
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '3.5rem'
                      }}
                    >
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
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        mb: 2
                      }}
                    >
                      Total Releases
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '3.5rem'
                      }}
                    >
                      {totalReleases}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper sx={{ 
              p: 3, 
              backgroundColor: '#2D2D2D', 
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ 
                pb: 3, 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '1.75rem'
                  }}
                >
                  Latest Releases
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  backgroundColor: '#2D2D2D',
                  color: '#FFFFFF'
                }}>
                  <thead>
                    <tr style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      textAlign: 'left'
                    }}>
                      <th style={{ 
                        padding: '16px', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>Release</th>
                      <th style={{ 
                        padding: '16px', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>Artist</th>
                      <th style={{ 
                        padding: '16px', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>Release Date</th>
                      <th style={{ 
                        padding: '16px', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>Type</th>
                      <th style={{ 
                        padding: '16px', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>Duration</th>
                      <th style={{ 
                        padding: '16px', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.map((release) => (
                      <tr 
                        key={release.id}
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '1rem'
                        }}
                      >
                        <td style={{ 
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {release.artwork_url && (
                            <img 
                              src={release.artwork_url} 
                              alt={release.title}
                              style={{ 
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                          <span style={{ fontWeight: 500 }}>{release.title}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <ArtistCell artists={release.artists} />
                        </td>
                        <td style={{ padding: '16px' }}>
                          {new Date(release.release_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: getReleaseTypeColor(release.release_type),
                            color: '#000',
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}>
                            {formatReleaseType(release.release_type)}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {formatDuration(getReleaseDuration(release))}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {release.spotify_url && (
                            <Button
                              variant="text"
                              size="small"
                              href={release.spotify_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: '#02FF95',
                                '&:hover': {
                                  color: '#00CC76',
                                  backgroundColor: 'rgba(2, 255, 149, 0.1)'
                                }
                              }}
                            >
                              View on Spotify
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>

            <Dialog
              open={importDialogOpen}
              onClose={() => setImportDialogOpen(false)}
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
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={() => setSnackbarOpen(false)}
              message={snackbarMessage}
              severity={snackbarVariant}
            />
          </>
        )}
      </Box>
    </Container>
  );
};

export default AdminDashboard;
