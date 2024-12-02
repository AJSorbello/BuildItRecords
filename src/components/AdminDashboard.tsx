import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { spotifyService } from '../services/SpotifyService';
import { extractSpotifyId, isValidSpotifyUrl, normalizeSpotifyUrl } from '../utils/spotifyUtils';
import { SpotifyTrack } from '../types/spotify';
import AdminTrackList from './AdminTrackList';
import { Track } from '../types/track';
import { RECORD_LABELS, RecordLabel } from '../constants/labels';
import { getData } from '../utils/dataInitializer';

interface TrackFormData {
  id: string;
  trackTitle: string;
  artist: string;
  spotifyUrl: string;
  recordLabel: RecordLabel;
}

const initialFormData: TrackFormData = {
  id: '',
  trackTitle: '',
  artist: '',
  spotifyUrl: '',
  recordLabel: RECORD_LABELS.RECORDS,
};

interface FetchState {
  loading: boolean;
  error: string | null;
}

const initialFetchState: FetchState = {
  loading: false,
  error: null,
};

interface SpotifyTrackData {
  id: string;
  trackTitle: string;
  artist: string;
  recordLabel: RecordLabel;
  spotifyUrl: string;
}

const validateRecordLabel = (label: string): RecordLabel => {
  if (Object.values(RECORD_LABELS).includes(label as RecordLabel)) {
    return label as RecordLabel;
  }
  return RECORD_LABELS.RECORDS; // Default to RECORDS if invalid
};

const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<TrackFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = () => {
    try {
      const storedTracks = localStorage.getItem('tracks');
      if (storedTracks) {
        setTracks(JSON.parse(storedTracks));
      } else {
        const { tracks } = getData();
        setTracks(tracks);
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
    }
  };

  const handleSpotifyFetch = async (trackId: string) => {
    setFetchState({
      loading: true,
      error: null,
    });

    try {
      await spotifyService.ensureAccessToken();
      const track = await spotifyService.getTrackDetails(trackId);
      
      if (!track) {
        throw new Error('Track not found');
      }

      setFormData({
        id: track.id,
        trackTitle: track.trackTitle,
        artist: track.artist,
        recordLabel: validateRecordLabel(track.recordLabel),
        spotifyUrl: track.spotifyUrl
      });

      setFetchState({
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching track:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch track details',
      });
    }
  };

  const handleSpotifyUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Original URL:', value);
    
    // Normalize the URL
    const normalizedUrl = normalizeSpotifyUrl(value);
    console.log('Normalized URL:', normalizedUrl);
    
    setFormData(prev => ({ ...prev, spotifyUrl: normalizedUrl }));
    
    if (!normalizedUrl) {
      setFetchState(initialFetchState);
      return;
    }

    try {
      // Log URL validation result
      const isValid = isValidSpotifyUrl(normalizedUrl);
      console.log('Is valid Spotify URL?', isValid);
      
      if (!isValid) {
        setFetchState({
          loading: false,
          error: 'Please enter a valid Spotify track URL (e.g., https://open.spotify.com/track/...)',
        });
        return;
      }

      // Log track ID extraction
      const trackId = extractSpotifyId(normalizedUrl);
      console.log('Extracted track ID:', trackId);
      
      if (!trackId) {
        setFetchState({
          loading: false,
          error: 'Could not extract track ID from URL',
        });
        return;
      }

      await handleSpotifyFetch(trackId);
    } catch (error) {
      console.error('Error processing Spotify URL:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to process Spotify URL',
      });
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setFormData(initialFormData);
    setEditingId(null);
    setFetchState(initialFetchState);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
    setFetchState(initialFetchState);
  };

  const handleEdit = (track: Track) => {
    setFormData({
      id: track.id,
      trackTitle: track.trackTitle,
      artist: track.artist,
      spotifyUrl: track.spotifyUrl,
      recordLabel: validateRecordLabel(track.recordLabel)
    });
    setEditingId(track.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    try {
      const updatedTracks = tracks.filter(track => track.id !== id);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
    } catch (err) {
      console.error('Error deleting track:', err);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<RecordLabel>) => {
    setFormData(prev => ({
      ...prev,
      recordLabel: e.target.value as RecordLabel
    }));
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!formData.spotifyUrl || !formData.trackTitle || !formData.artist || !formData.recordLabel) {
      setFetchState({
        loading: false,
        error: 'Please fill in all required fields'
      });
      return;
    }

    try {
      let updatedTracks: Track[];
      const newTrack: Track = {
        id: editingId || crypto.randomUUID(),
        trackTitle: formData.trackTitle,
        artist: formData.artist,
        spotifyUrl: formData.spotifyUrl,
        recordLabel: formData.recordLabel
      };

      if (editingId) {
        updatedTracks = tracks.map(track => 
          track.id === editingId ? newTrack : track
        );
      } else {
        updatedTracks = [...tracks, newTrack];
      }
      
      console.log('Saving track:', newTrack);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
      handleClose();
    } catch (err) {
      console.error('Error saving track:', err);
      setFetchState({
        loading: false,
        error: 'Failed to save track'
      });
    }
  };

  const extractSpotifyMetadata = async () => {
    if (!formData.spotifyUrl) return;

    setFetchState({ loading: true, error: null });
    try {
      const trackId = formData.spotifyUrl.split('/').pop()?.split('?')[0];
      if (!trackId) throw new Error('Invalid Spotify URL');

      // Here you would typically make an API call to get track metadata
      // For now, we'll just use the URL as is
      const track: SpotifyTrackData = {
        id: trackId,
        trackTitle: 'Sample Track',
        artist: 'Sample Artist',
        recordLabel: RECORD_LABELS.RECORDS,
        spotifyUrl: formData.spotifyUrl
      };

      setFormData({
        id: track.id,
        trackTitle: track.trackTitle,
        artist: track.artist,
        recordLabel: validateRecordLabel(track.recordLabel),
        spotifyUrl: track.spotifyUrl
      });
    } catch (error) {
      setFetchState({ loading: false, error: 'Failed to fetch track metadata' });
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        backgroundColor: '#282828',
        p: 3,
        borderRadius: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ color: '#FFFFFF' }}>
          Track Management
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleOpen}
          sx={{
            backgroundColor: '#02FF95',
            color: '#121212',
            '&:hover': {
              backgroundColor: '#00CC76',
            }
          }}
        >
          Add New Track
        </Button>
      </Box>

      {fetchState.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {fetchState.error}
        </Typography>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mb: 3 }}>
          Submitted Tracks
        </Typography>
        <AdminTrackList tracks={tracks} onEditTrack={handleEdit} onDeleteTrack={handleDelete} />
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: '#282828',
            minWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF' }}>
          {editingId ? 'Edit Track' : 'Add New Track'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Spotify URL"
              value={formData.spotifyUrl}
              onChange={handleSpotifyUrlChange}
              sx={{ mb: 2, input: { color: '#FFFFFF' } }}
              InputLabelProps={{ sx: { color: '#999' } }}
            />
            <Button
              onClick={extractSpotifyMetadata}
              disabled={fetchState.loading || !formData.spotifyUrl}
              sx={{ mt: 1 }}
            >
              Extract Metadata
            </Button>

            <TextField
              fullWidth
              name="trackTitle"
              label="Track Title"
              value={formData.trackTitle}
              onChange={handleTextInputChange}
              sx={{ mb: 2, input: { color: '#FFFFFF' } }}
              InputLabelProps={{ sx: { color: '#999' } }}
            />
            <TextField
              fullWidth
              name="artist"
              label="Artist"
              value={formData.artist}
              onChange={handleTextInputChange}
              sx={{ mb: 2, input: { color: '#FFFFFF' } }}
              InputLabelProps={{ sx: { color: '#999' } }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Record Label</InputLabel>
              <Select<RecordLabel>
                name="recordLabel"
                value={formData.recordLabel}
                onChange={handleSelectChange}
                label="Record Label"
              >
                {Object.values(RECORD_LABELS).map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.trackTitle || !formData.artist || !formData.spotifyUrl || fetchState.loading}
            sx={{
              backgroundColor: '#02FF95',
              color: '#121212',
              '&:hover': {
                backgroundColor: '#00CC76',
              },
              '&:disabled': {
                backgroundColor: '#666',
                color: '#999'
              }
            }}
          >
            {editingId ? 'Update Track' : 'Add Track'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
