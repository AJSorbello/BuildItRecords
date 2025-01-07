import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Pagination,
  Grid,
  Paper
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import TrackManager from './admin/TrackManager';
import { DatabaseService } from '../services/DatabaseService';
import { Track } from '../types/track';

const databaseService = new DatabaseService();
const ITEMS_PER_PAGE = 10;

const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  useEffect(() => {
    handleRefresh();
  }, [selectedLabel]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tracks for label:', selectedLabel);
      const response = await databaseService.getReleasesByLabelId(selectedLabel);
      console.log('Received response:', response);
      
      // Ensure we're getting an array of tracks
      const fetchedTracks = response?.releases?.flatMap(release => 
        release.tracks.map(track => ({
          ...track,
          album: {
            ...track.album,
            images: track.album.images || [],
            release_date: track.album.release_date || new Date().toISOString().split('T')[0]
          },
          artists: track.artists.map(artist => ({
            ...artist,
            external_urls: artist.external_urls || { spotify: '' }
          })),
          external_urls: track.external_urls || { spotify: '' },
          duration_ms: track.duration_ms || 0,
          preview_url: track.preview_url || null,
          popularity: track.popularity || 0,
          explicit: track.explicit || false,
          track_number: track.track_number || 1,
          disc_number: track.disc_number || 1,
          is_local: track.is_local || false
        }))
      ) || [];

      console.log('Processed tracks:', fetchedTracks);
      setTracks(fetchedTracks);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError(err.message || 'Failed to fetch tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleEditTrack = (track: Track) => {
    console.log('Editing track:', track);
    // Implement edit functionality
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      setLoading(true);
      await databaseService.deleteTrack(trackId);
      setTracks(tracks.filter(track => track.id !== trackId));
    } catch (err) {
      setError(err.message || 'Failed to delete track');
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artists.some(artist => 
      artist.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    track.album.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);
  const currentTracks = filteredTracks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your music catalog
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search tracks"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearch}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TrackManager
              tracks={currentTracks}
              onEditTrack={handleEditTrack}
              onDeleteTrack={handleDeleteTrack}
            />
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
