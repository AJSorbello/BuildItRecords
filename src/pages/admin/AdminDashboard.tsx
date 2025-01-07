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
  MenuItem
} from '@mui/material';
import TrackManager from '../../components/admin/TrackManager';
import { databaseService } from '../../services/DatabaseService';
import { RECORD_LABELS } from '../../constants/labels';
import { Release, Track } from '../../types';

const AdminDashboard: React.FC = () => {
  console.log('AdminDashboard initializing');
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState('buildit-deep');
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [totalReleases, setTotalReleases] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.log('Fetching releases for label:', selectedLabel);
      setLoading(true);
      setError(null);
      
      const response = await databaseService.getReleasesByLabelId(selectedLabel);
      console.log('Received response:', response);

      if (response?.releases) {
        console.log('Number of releases:', response.releases.length);
        setReleases(response.releases);
        setTotalReleases(response.totalReleases);

        // Extract tracks from releases
        const allTracks: Track[] = [];
        response.releases.forEach(release => {
          console.log('Processing release:', release.name, 'Tracks:', release.tracks?.length);
          console.log('Release data:', release);
          
          if (release.tracks?.length) {
            release.tracks.forEach(track => {
              console.log('Processing track:', track.name, 'Album:', release.name);
              allTracks.push({
                ...track,
                album: {
                  id: release.id,
                  name: release.name,
                  release_date: release.release_date,
                  artwork_url: release.artwork_url,
                  images: [{ url: release.artwork_url || '', height: 640, width: 640 }],
                  external_urls: {
                    spotify: release.spotify_url || ''
                  }
                }
              });
            });
          }
        });
        
        console.log('Total tracks processed:', allTracks.length);
        setTracks(allTracks);
      }
    } catch (error: any) {
      console.error('Error fetching releases:', error);
      setError(error.message || 'Failed to fetch releases');
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

  console.log('Rendering AdminDashboard - Releases:', releases.length, 'Tracks:', tracks.length);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 4 }}>
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
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                {RECORD_LABELS[selectedLabel]?.displayName} Releases ({tracks.length} Tracks)
              </Typography>
              <Grid container spacing={2}>
                {tracks.map((track) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={track.album?.artwork_url || track.album?.images?.[0]?.url || ''}
                        alt={track.name}
                      />
                      <CardContent>
                        <Typography variant="subtitle1" noWrap>
                          {track.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {track.artists?.map(artist => artist.name).join(', ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {track.album?.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom>
                Track Management
              </Typography>
              <TrackManager
                tracks={tracks}
                onDeleteTrack={(id) => console.log('Delete track:', id)}
                onUpdateTrack={(track) => console.log('Update track:', track)}
              />
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default AdminDashboard;
