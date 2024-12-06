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
  releaseDate: string;
}

const initialFormData: TrackFormData = {
  id: '',
  trackTitle: '',
  artist: '',
  spotifyUrl: '',
  recordLabel: RECORD_LABELS.RECORDS,
  albumCover: 'https://via.placeholder.com/300', // Default album cover
  releaseDate: ''
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
  releaseDate: string;
}

const validateRecordLabel = (label: string): RecordLabel => {
  if (Object.values(RECORD_LABELS).includes(label as RecordLabel)) {
    return label as RecordLabel;
  }
  return RECORD_LABELS.RECORDS; // Default to RECORDS if invalid
};

interface ImportProgress {
  imported: number;
  total: number;
}

const AdminDashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  console.log('Dialog open state:', open);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TrackFormData>(initialFormData);
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLabel, setImportLabel] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<RecordLabel | 'All'>('All');
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  useEffect(() => {
    // Initialize data if needed
    const storedTracks = localStorage.getItem('tracks');
    if (!storedTracks) {
      console.log('No tracks found in localStorage, initializing with mock data');
      resetData();
    }
    
    // Load and sort tracks from localStorage
    const data = getData();
    const sortedTracks = data.tracks.sort((a, b) => {
      const dateA = new Date(a.releaseDate || '');
      const dateB = new Date(b.releaseDate || '');
      return dateB.getTime() - dateA.getTime();
    });
    console.log('Loaded tracks from localStorage:', sortedTracks);
    setTracks(sortedTracks);
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
        albumCover: trackDetails.albumCover,
        releaseDate: trackDetails.releaseDate
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
        recordLabel: validateRecordLabel(track.recordLabel),
        releaseDate: track.releaseDate
      }));

      // Debug log
      console.log('Updated form data with album cover:', {
        trackTitle: track.trackTitle,
        artist: track.artist,
        albumCover: track.albumCover,
        recordLabel: track.recordLabel,
        releaseDate: track.releaseDate
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
    console.log('Add New Track button clicked');
    setOpen(true);
    setFormData(initialFormData);
    setEditingId(null);
    setFetchState(initialFetchState);
    console.log('Dialog state set to open');
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
      albumCover: track.albumCover || '',
      releaseDate: track.releaseDate || '' // Provide empty string as fallback
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
              recordLabel: validateRecordLabel(trackDetails.recordLabel),
              releaseDate: trackDetails.releaseDate
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

      // Check for duplicates
      const normalizedUrl = normalizeSpotifyUrl(formData.spotifyUrl);
      const isDuplicate = tracks.some(track => 
        track.id !== editingId && // Ignore current track when editing
        normalizeSpotifyUrl(track.spotifyUrl) === normalizedUrl
      );

      if (isDuplicate) {
        setFetchState({
          loading: false,
          error: 'This track already exists in the database'
        });
        return;
      }

      // Ensure we have track details from Spotify
      let trackDetails = formData;
      if (!formData.albumCover) {
        const spotifyDetails = await spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
        if (spotifyDetails) {
          trackDetails = {
            ...formData,
            albumCover: spotifyDetails.albumCover,
            releaseDate: spotifyDetails.releaseDate
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
        albumCover: trackDetails.albumCover || 'https://via.placeholder.com/300',
        releaseDate: trackDetails.releaseDate
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
        albumCover: trackDetails.albumCover,
        releaseDate: trackDetails.releaseDate
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

  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    setImportLabel('');
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportLabel('');
  };

  const handleImportTracks = async () => {
    if (!importLabel) {
      setFetchState({
        loading: false,
        error: 'Please enter a label name'
      });
      return;
    }

    // Validate label name format
    const validLabels = ['build it deep', 'build it records', 'build it tech'];
    if (!validLabels.includes(importLabel.toLowerCase())) {
      setFetchState({
        loading: false,
        error: 'Please enter a valid label name: "Build It Deep", "Build It Records", or "Build It Tech"'
      });
      return;
    }

    setImporting(true);
    setImportProgress(null);
    setFetchState({ loading: true, error: null });

    try {
      const initialTrackCount = tracks.length;
      
      await spotifyService.importLabelTracks(
        importLabel,
        50, // batch size
        (imported, total) => {
          setImportProgress({ imported, total });
        }
      );

      // Reload tracks after import
      const data = getData();
      setTracks(data.tracks);
      
      // Calculate new tracks added
      const newTracksCount = data.tracks.length - initialTrackCount;
      
      // Show success message with count
      alert(`Successfully imported ${newTracksCount} new tracks from ${importLabel}`);
      
      // Reset state
      setImportDialogOpen(false);
      setImportLabel('');
      setImportProgress(null);
      setFetchState({ loading: false, error: null });
    } catch (error) {
      console.error('Error importing tracks:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred while importing tracks'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleLabelChange = (event: SelectChangeEvent<RecordLabel | 'All'>) => {
    setSelectedLabel(event.target.value as RecordLabel | 'All');
  };

  const filteredTracks = selectedLabel === 'All' ? tracks : tracks.filter(track => track.recordLabel === selectedLabel);

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
        <Box>
          <Button
            variant="contained"
            onClick={handleImportDialogOpen}
            sx={{ mr: 2 }}
          >
            Import by Label
          </Button>
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
      </Box>

      {fetchState.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {fetchState.error}
        </Typography>
      )}

      <FormControl fullWidth margin="normal">
        <InputLabel sx={{ color: '#FFFFFF' }}>Filter by Label</InputLabel>
        <Select
          value={selectedLabel}
          onChange={handleLabelChange}
          sx={{ color: '#FFFFFF', mb: 2 }}
          inputProps={{ sx: { color: '#FFFFFF' } }}
        >
          <MenuItem value="All">All</MenuItem>
          {Object.values(RECORD_LABELS).map((label) => (
            <MenuItem key={label} value={label}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
        {filteredTracks.map(track => (
          <Box component="li" key={track.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, backgroundColor: '#333', p: 2, borderRadius: 1 }}>
            <Box component="img" src={track.albumCover} alt={track.trackTitle} sx={{ width: 50, height: 50, mr: 2, borderRadius: 1 }} />
            <Typography variant="body1" sx={{ color: '#FFFFFF', flex: 1 }}>{track.trackTitle}</Typography>
            <Typography variant="body2" sx={{ color: '#AAAAAA', flex: 1 }}>{track.artist}</Typography>
            <Typography variant="body2" sx={{ color: '#AAAAAA', flex: 1 }}>{track.recordLabel}</Typography>
            <Typography variant="body2" sx={{ color: '#AAAAAA', flex: 1 }}>{track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : 'Unknown'}</Typography>
          </Box>
        ))}
      </Box>

      <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)}>
        <DialogTitle>Import Tracks by Label</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <TextField
              fullWidth
              label="Label Name"
              value={importLabel}
              onChange={(e) => setImportLabel(e.target.value)}
              disabled={importing}
              helperText="Enter exact label name: 'Build It Deep', 'Build It Records', or 'Build It Tech'"
              error={Boolean(fetchState.error)}
            />
            {fetchState.error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {fetchState.error}
              </Typography>
            )}
            {importing && importProgress && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mb: 1 }} />
                <Typography variant="body2">
                  Importing tracks: {importProgress.imported} of {importProgress.total}
                  {importProgress.imported < importProgress.total && '... (waiting 3s between batches)'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImportTracks}
            variant="contained"
            color="primary"
            disabled={importing || !importLabel}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Track</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Track Title"
            fullWidth
            variant="outlined"
            value={formData.trackTitle}
            onChange={handleTextInputChange}
            name="trackTitle"
          />
          <TextField
            margin="dense"
            label="Artist"
            fullWidth
            variant="outlined"
            value={formData.artist}
            onChange={handleTextInputChange}
            name="artist"
          />
          <TextField
            margin="dense"
            label="Spotify URL"
            fullWidth
            variant="outlined"
            value={formData.spotifyUrl}
            onChange={handleTextInputChange}
            name="spotifyUrl"
          />
          <TextField
            margin="dense"
            label="Release Date"
            fullWidth
            variant="outlined"
            value={formData.releaseDate}
            onChange={handleTextInputChange}
            name="releaseDate"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Record Label</InputLabel>
            <Select
              value={formData.recordLabel}
              onChange={handleSelectChange}
              name="recordLabel"
            >
              {Object.values(RECORD_LABELS).map((label) => (
                <MenuItem key={label} value={label}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
