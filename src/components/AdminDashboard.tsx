import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { Track } from '../types/track';
import { databaseService } from '../services/DatabaseService';
import { spotifyService } from '../services/SpotifyService';
import { TrackManager } from './admin/TrackManager';
import { EditTrackDialog } from './EditTrackDialog';
import { RECORD_LABELS } from '../constants';
import { RecordLabelId } from '../types/release';

const AdminDashboard: React.FC = () => {
  // State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<RecordLabelId>('buildit-deep');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tracksPerPage] = useState(10);

  // Load tracks on mount and when label changes
  useEffect(() => {
    console.log('Label changed to:', selectedLabel);
    if (selectedLabel) {
      handleRefresh();
    } else {
      console.log('No label selected');
    }
  }, [selectedLabel]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing tracks for label:', selectedLabel);

      const response = await databaseService.getReleasesByLabelId(selectedLabel);
      console.log('Fetched response:', response);

      if (response && Array.isArray(response.releases)) {
        // Extract all tracks from releases
        const allTracks = response.releases.flatMap(release => {
          console.log('Processing release in AdminDashboard:', release);
          const releaseTracks = release.tracks || [];
          console.log('Release tracks:', releaseTracks);
          
          return releaseTracks.map(track => {
            console.log('Processing track in AdminDashboard:', track);
            return {
              ...track,
              album: {
                name: release.name || '',
                artwork_url: release.artwork_url || ''
              }
            };
          });
        });
        
        console.log('Extracted tracks:', allTracks);
        
        if (allTracks.length === 0) {
          console.log('No tracks found in releases');
        }
        
        setTracks(allTracks);
        console.log('Updated tracks state:', allTracks);
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error refreshing tracks:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh tracks');
      setTracks([]); // Reset tracks on error
    } finally {
      setLoading(false);
    }
  };

  const handleImportReleases = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting import for label:', selectedLabel);

      // Get the playlist ID for the selected label
      const playlistId = await spotifyService.getPlaylistIdByLabel(selectedLabel);
      if (!playlistId) {
        throw new Error(`No playlist found for label ${selectedLabel}`);
      }
      console.log('Found playlist:', playlistId);

      // Import tracks from the playlist
      console.log('Importing tracks from playlist...');
      const importedTracks = await spotifyService.importLabelTracks(playlistId);
      console.log('Imported tracks:', importedTracks);

      if (!importedTracks || importedTracks.length === 0) {
        throw new Error('No tracks were imported');
      }

      // Save the imported tracks
      console.log('Saving tracks to database...');
      const savedTracks = await databaseService.saveTracks(importedTracks);
      console.log('Saved tracks:', savedTracks);

      // Refresh the list to ensure we have the latest data
      console.log('Refreshing track list...');
      await handleRefresh();

      // Show success message
      setError(null);
      alert(`Successfully imported ${savedTracks.length} tracks`);
    } catch (error) {
      console.error('Error importing releases:', error);
      setError(error instanceof Error ? error.message : 'Failed to import releases');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrack = (track: Track) => {
    setSelectedTrack(track);
    setEditDialogOpen(true);
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await databaseService.deleteTrack(trackId);
      setTracks(prevTracks => prevTracks.filter(t => t.id !== trackId));
    } catch (error) {
      console.error('Error deleting track:', error);
      setError('Failed to delete track');
    }
  };

  const handleLabelChange = (event: SelectChangeEvent<string>) => {
    setSelectedLabel(event.target.value as RecordLabelId);
    setCurrentPage(1); // Reset to first page when changing label
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const filterTracks = (track: Track) => {
    if (!track) return false;
    
    const trackName = track.name || '';
    const artistName = Array.isArray(track.artists) 
      ? track.artists.map(a => typeof a === 'string' ? a : a.name).join(', ')
      : track.artists || '';
    const albumName = track.album?.name || '';

    const searchLower = searchQuery.toLowerCase();
    return (
      trackName.toLowerCase().includes(searchLower) ||
      artistName.toLowerCase().includes(searchLower) ||
      albumName.toLowerCase().includes(searchLower)
    );
  };

  // Filter tracks based on search query and selected label
  const filteredTracks = (tracks || []).filter(track => {
    if (!track) return false;
    
    const trackTitle = track.name || '';
    const artistName = Array.isArray(track.artists) 
      ? track.artists.map(a => typeof a === 'string' ? a : a.name).join(', ')
      : track.artists || '';
    const spotifyUrl = track.spotifyUrl || '';
    
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      trackTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spotifyUrl.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabel = selectedLabel === RECORD_LABELS.ALL.id || track.recordLabel === selectedLabel;
    
    return matchesSearch && matchesLabel;
  });

  // Get current tracks for pagination
  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack);

  // Calculate total pages
  const totalPages = Math.ceil(filteredTracks.length / tracksPerPage);

  console.log('Rendering AdminDashboard with:', {
    totalTracks: tracks.length,
    filteredTracks: filteredTracks.length,
    currentTracks: currentTracks.length,
    currentPage,
    totalPages
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Label</InputLabel>
            <Select
              value={selectedLabel}
              onChange={handleLabelChange}
              label="Label"
            >
              {Object.entries(RECORD_LABELS).map(([key, label]) => (
                <MenuItem key={label.id} value={label.id}>
                  {label.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            onClick={handleImportReleases}
            disabled={loading || !selectedLabel}
          >
            Import Releases
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading || !selectedLabel}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <CircularProgress sx={{ mb: 2 }} />}

        <TrackManager
          tracks={currentTracks}
          onEditTrack={handleEditTrack}
          onDeleteTrack={handleDeleteTrack}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}

        {selectedTrack && (
          <EditTrackDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            track={selectedTrack}
            onSave={async (updatedTrack) => {
              try {
                const savedTrack = await databaseService.updateTrack(updatedTrack);
                setTracks(prevTracks =>
                  prevTracks.map(track =>
                    track.id === savedTrack.id ? savedTrack : track
                  )
                );
                setEditDialogOpen(false);
              } catch (error) {
                console.error('Error updating track:', error);
                setError(error instanceof Error ? error.message : 'Failed to update track');
              }
            }}
          />
        )}
      </Box>
    </Container>
  );
};

export default AdminDashboard;
