import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import TrackManager from '../../components/admin/TrackManager';
import { ImportStatus } from '../../components/ImportStatus';
import { databaseService } from '../../services/DatabaseService';
import { RECORD_LABELS } from '../../constants/labels';
import { Track } from '../../types/track';

export const TrackManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(Object.keys(RECORD_LABELS)[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recordLabel = RECORD_LABELS[selectedLabel];
      if (recordLabel) {
        const response = await databaseService.getTracksByLabel(recordLabel, 'created_at');
        setTracks(response.tracks);
      }
    } catch (err) {
      setError('Failed to fetch tracks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchTracks();
  }, [selectedLabel]);

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLabel(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleEditTrack = (track: Track) => {
    navigate(`/admin/tracks/edit/${track.id}`);
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await databaseService.deleteTrack(trackId);
      fetchTracks(); // Refresh the list
    } catch (err) {
      setError('Failed to delete track');
      console.error(err);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#FFFFFF' }}>
          Track Management
        </Typography>

        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Label"
                      value={selectedLabel}
                      onChange={handleLabelChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#FFFFFF',
                          },
                          '&:hover fieldset': {
                            borderColor: '#02FF95',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#FFFFFF',
                        },
                        '& .MuiSelect-icon': {
                          color: '#FFFFFF',
                        },
                      }}
                    >
                      {Object.entries(RECORD_LABELS).map(([id, label]) => (
                        <MenuItem key={id} value={id}>
                          {label.displayName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search Tracks"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search by title, artist, or release..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#FFFFFF',
                          },
                          '&:hover fieldset': {
                            borderColor: '#02FF95',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#FFFFFF',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={fetchTracks}
                      startIcon={<RefreshIcon />}
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Import Status */}
          <Grid item xs={12}>
            <ImportStatus
              labelId={selectedLabel}
              onImportComplete={fetchTracks}
            />
          </Grid>

          {/* Tracks Table */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
              <CardContent>
                {loading && <LinearProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TrackManager
                  tracks={tracks.filter(track =>
                    searchQuery
                      ? track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        track.artists.some(artist => artist.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        track.release.name.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )}
                  onEdit={handleEditTrack}
                  onDelete={handleDeleteTrack}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TrackManagement;
