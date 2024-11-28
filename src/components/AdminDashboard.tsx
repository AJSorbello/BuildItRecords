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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import SpotifyService from '../services/SpotifyService';
import { extractSpotifyId } from '../utils/spotifyUtils';
import { SpotifyTrack } from '../types/spotify';

interface Track {
  id: string;
  name: string;
  artist: string;
  spotifyUrl: string;
  albumArt: string;
}

interface TrackFormData {
  name: string;
  artist: string;
  spotifyUrl: string;
  albumArt: string;
}

const initialFormData: TrackFormData = {
  name: '',
  artist: '',
  spotifyUrl: '',
  albumArt: ''
};

interface FetchState {
  loading: boolean;
  error: string | null;
  data: SpotifyTrack | null;
}

const initialFetchState: FetchState = {
  loading: false,
  error: null,
  data: null,
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
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
    }
  };

  const fetchSpotifyTrackDetails = async (url: string) => {
    setFetchState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const trackId = extractSpotifyId(url);
      if (!trackId) {
        throw new Error('Invalid Spotify URL format');
      }

      const spotifyService = SpotifyService.getInstance();
      await spotifyService.ensureAccessToken();
      const track = await spotifyService.getTrackDetails(trackId);

      setFetchState({
        loading: false,
        error: null,
        data: track as SpotifyTrack
      });

      setFormData({
        name: track.name,
        artist: track.artists[0]?.name || '',
        spotifyUrl: track.external_urls?.spotify || url,
        albumArt: track.album.images[0]?.url || ''
      });

    } catch (err) {
      console.error('Error fetching track details:', err);
      setFetchState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch track details',
        data: null
      });
      
      setFormData(prev => ({
        ...initialFormData,
        spotifyUrl: prev.spotifyUrl
      }));
    }
  };

  const handleSpotifyUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, spotifyUrl: value }));
    if (value && value.includes('spotify.com/track/')) {
      await fetchSpotifyTrackDetails(value);
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
    // Convert Track to TrackFormData
    setFormData({
      name: track.name,
      artist: track.artist,
      spotifyUrl: track.spotifyUrl,
      albumArt: track.albumArt || '' // Provide default empty string if albumArt is undefined
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.spotifyUrl || !formData.name || !formData.artist) {
      console.error('Please enter a valid Spotify URL and wait for track details to load');
      return;
    }

    try {
      let updatedTracks: Track[];
      const newTrack: Track = {
        id: editingId || crypto.randomUUID(),
        name: formData.name,
        artist: formData.artist,
        spotifyUrl: formData.spotifyUrl,
        albumArt: formData.albumArt
      };

      if (editingId) {
        updatedTracks = tracks.map(track => 
          track.id === editingId ? newTrack : track
        );
      } else {
        updatedTracks = [...tracks, newTrack];
      }
      
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
      handleClose();
    } catch (err) {
      console.error('Error saving track:', err);
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

      <TableContainer component={Paper} sx={{ backgroundColor: '#282828' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Name</TableCell>
              <TableCell sx={{ color: '#999' }}>Artist</TableCell>
              <TableCell sx={{ color: '#999' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell sx={{ color: '#FFF' }}>{track.name}</TableCell>
                <TableCell sx={{ color: '#FFF' }}>{track.artist}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(track)} sx={{ color: '#02FF95' }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(track.id)} sx={{ color: '#FF4444' }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: '#282828',
            color: '#FFFFFF'
          }
        }}
      >
        <DialogTitle>{editingId ? 'Edit Track' : 'Add New Track'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Spotify URL"
              name="spotifyUrl"
              value={formData.spotifyUrl}
              onChange={handleSpotifyUrlChange}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#666' },
                  '&:hover fieldset': { borderColor: '#999' },
                },
                '& .MuiInputLabel-root': { color: '#999' },
                '& .MuiOutlinedInput-input': { color: '#FFF' },
              }}
            />
            {fetchState.loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress sx={{ color: '#02FF95' }} />
              </Box>
            )}
            {fetchState.data && (
              <Box sx={{ my: 2, p: 2, backgroundColor: '#1e1e1e', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ color: '#02FF95' }}>
                  Track Details:
                </Typography>
                <Typography sx={{ color: '#FFF' }}>
                  {fetchState.data.name} - {fetchState.data.artists[0]?.name || ''}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleClose}
              sx={{ color: '#999' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={fetchState.loading || !formData.name}
              sx={{
                backgroundColor: '#02FF95',
                color: '#121212',
                '&:hover': {
                  backgroundColor: '#00CC76',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#1a1a1a',
                  color: '#666',
                }
              }}
            >
              {editingId ? 'Save Changes' : 'Add Track'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
