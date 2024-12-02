import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { Track } from '../types/track';
import { RecordLabel } from '../constants/labels';
import AdminTrackList from './AdminTrackList';
import { spotifyService } from '../services/SpotifyService';
import { getData, resetData } from '../utils/dataInitializer';
import { extractSpotifyId, isValidSpotifyUrl, normalizeSpotifyUrl } from '../utils/spotifyUtils';
import { SpotifyTrack } from '../types/spotify';

interface TrackFormData {
  id: string;
  trackTitle: string;
  artist: string;
  spotifyUrl: string;
  recordLabel: RecordLabel;
  albumCover: string;
}

const initialFormData: TrackFormData = {
  id: '',
  trackTitle: '',
  artist: '',
  spotifyUrl: '',
  recordLabel: RECORD_LABELS.RECORDS,
  albumCover: 'https://via.placeholder.com/300' // Default album cover
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
  albumCover: string;
}

const validateRecordLabel = (label: string): RecordLabel => {
  if (Object.values(RECORD_LABELS).includes(label as RecordLabel)) {
    return label as RecordLabel;
  }
  return RECORD_LABELS.RECORDS; // Default to RECORDS if invalid
};

const AdminDashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TrackFormData>(initialFormData);
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);

  useEffect(() => {
    // Initialize data if needed
    const storedTracks = localStorage.getItem('tracks');
    if (!storedTracks) {
      console.log('No tracks found in localStorage, initializing with mock data');
      resetData();
    }
    
    // Load tracks from localStorage
    const data = getData();
    console.log('Loaded tracks from localStorage:', data.tracks);
    setTracks(data.tracks);
  }, []);

  const handleSpotifyFetch = async (trackId: string) => {
    setFetchState({
      loading: true,
      error: null,
    });

    try {
      // Get track details from Spotify
      const trackDetails = await spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
      if (!trackDetails) {
        throw new Error('Failed to fetch track details from Spotify');
      }

      // Debug log
      console.log('Fetched track details:', trackDetails);

      setFormData({
        id: trackDetails.id,
        trackTitle: trackDetails.trackTitle,
        artist: trackDetails.artist,
        recordLabel: validateRecordLabel(trackDetails.recordLabel),
        spotifyUrl: trackDetails.spotifyUrl,
        albumCover: trackDetails.albumCover
      });

      setFetchState({
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error processing Spotify URL:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to process Spotify URL',
      });
    }
  };

  const handleSpotifyUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Original URL:', value);
    
    // Update form with URL immediately
    setFormData(prev => ({ ...prev, spotifyUrl: value }));
    
    if (!value) {
      setFetchState(initialFetchState);
      return;
    }

    try {
      const trackId = extractSpotifyId(value);
      console.log('Extracted track ID:', trackId);
      
      if (!trackId) {
        setFetchState({
          loading: false,
          error: 'Could not extract track ID from URL',
        });
        return;
      }

      // Get track details from Spotify
      setFetchState({
        loading: true,
        error: null,
      });

      const track = await spotifyService.getTrackDetails(trackId);
      console.log('Fetched Spotify track:', track);

      if (!track || !track.albumCover) {
        setFetchState({
          loading: false,
          error: 'Failed to fetch track details or album cover from Spotify',
        });
        return;
      }

      // Update form with track details including album cover
      setFormData(prev => ({
        ...prev,
        trackTitle: track.trackTitle,
        artist: track.artist,
        albumCover: track.albumCover, // This is now required
        recordLabel: validateRecordLabel(track.recordLabel)
      }));

      // Debug log
      console.log('Updated form data with album cover:', {
        trackTitle: track.trackTitle,
        artist: track.artist,
        albumCover: track.albumCover,
        recordLabel: track.recordLabel
      });

      setFetchState({
        loading: false,
        error: null,
      });
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
      recordLabel: validateRecordLabel(track.recordLabel),
      albumCover: track.albumCover || ''
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

  const handleTextInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If Spotify URL changes and it's a valid URL, fetch metadata
    if (name === 'spotifyUrl' && value) {
      try {
        console.log('Spotify URL changed, fetching metadata...');
        const trackId = value.split('/').pop()?.split('?')[0];
        if (trackId) {
          setFetchState({ loading: true, error: null });
          const trackDetails = await spotifyService.getTrackDetailsByUrl(value);
          
          if (trackDetails) {
            console.log('Got track details:', trackDetails);
            setFormData(prev => ({
              ...prev,
              trackTitle: trackDetails.trackTitle,
              artist: trackDetails.artist,
              albumCover: trackDetails.albumCover,
              recordLabel: validateRecordLabel(trackDetails.recordLabel)
            }));
            setFetchState({ loading: false, error: null });
          } else {
            throw new Error('Failed to fetch track details');
          }
        }
      } catch (error) {
        console.error('Error fetching track metadata:', error);
        setFetchState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch track metadata'
        });
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<RecordLabel>) => {
    setFormData(prev => ({
      ...prev,
      recordLabel: e.target.value as RecordLabel
    }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!formData.spotifyUrl || !formData.trackTitle || !formData.artist || !formData.recordLabel) {
      setFetchState({
        loading: false,
        error: 'Please fill in all required fields'
      });
      return;
    }

    try {
      setFetchState({ loading: true, error: null });

      // Ensure we have track details from Spotify
      let trackDetails = formData;
      if (!formData.albumCover) {
        const spotifyDetails = await spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
        if (spotifyDetails) {
          trackDetails = {
            ...formData,
            albumCover: spotifyDetails.albumCover
          };
        }
      }

      // Debug log before saving
      console.log('Track details before saving:', trackDetails);

      const newTrack: Track = {
        id: editingId || crypto.randomUUID(),
        trackTitle: trackDetails.trackTitle,
        artist: trackDetails.artist,
        spotifyUrl: trackDetails.spotifyUrl,
        recordLabel: trackDetails.recordLabel,
        albumCover: trackDetails.albumCover || 'https://via.placeholder.com/300'
      };

      // Debug log
      console.log('New track to save:', newTrack);

      let updatedTracks: Track[];
      if (editingId) {
        updatedTracks = tracks.map(track => 
          track.id === editingId ? newTrack : track
        );
      } else {
        updatedTracks = [...tracks, newTrack];
      }
      
      // Debug log before localStorage
      console.log('Tracks to save to localStorage:', updatedTracks);

      // Save to localStorage
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));

      // Verify saved data
      const savedData = localStorage.getItem('tracks');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      console.log('Verified saved data:', parsedData);

      setTracks(updatedTracks);
      setFetchState({ loading: false, error: null });
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
      // Get track details from Spotify
      const trackDetails = await spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
      if (!trackDetails) {
        throw new Error('Failed to fetch track details from Spotify');
      }

      // Debug log
      console.log('Fetched track details:', trackDetails);

      setFormData({
        id: trackDetails.id,
        trackTitle: trackDetails.trackTitle,
        artist: trackDetails.artist,
        recordLabel: validateRecordLabel(trackDetails.recordLabel),
        spotifyUrl: trackDetails.spotifyUrl,
        albumCover: trackDetails.albumCover
      });

      setFetchState({ loading: false, error: null });
    } catch (error) {
      console.error('Error fetching track metadata:', error);
      setFetchState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch track metadata'
      });
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
            <TextField
              fullWidth
              name="albumCover"
              label="Album Cover"
              value={formData.albumCover}
              onChange={handleTextInputChange}
              sx={{ mb: 2, input: { color: '#FFFFFF' } }}
              InputLabelProps={{ sx: { color: '#999' } }}
            />
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
