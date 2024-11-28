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

interface Track {
  id: string;
  name: string;
  artist: string;
  spotifyUrl: string;
  albumArt?: string;
}

interface TrackFormData {
  name: string;
  artist: string;
  spotifyUrl: string;
}

const initialFormData: TrackFormData = {
  name: '',
  artist: '',
  spotifyUrl: '',
};

const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<TrackFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
      setError('Failed to fetch tracks');
    }
  };

  const extractSpotifyId = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const fetchSpotifyTrackDetails = async (url: string) => {
    const trackId = extractSpotifyId(url);
    if (!trackId) {
      setError('Invalid Spotify URL');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Fetching track details for ID:', trackId);
      const response = await fetch(`/api/spotify/track/${trackId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || data.details || 'Failed to fetch track details');
      }

      console.log('Track details received:', data);
      setFormData(prev => ({
        ...prev,
        name: data.name,
        artist: data.artists[0].name,
        spotifyUrl: url
      }));
    } catch (err) {
      console.error('Error fetching track details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch track details');
      setFormData(prev => ({
        ...prev,
        name: '',
        artist: ''
      }));
    } finally {
      setLoading(false);
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
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (track: Track) => {
    setFormData(track);
    setEditingId(track.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    try {
      const updatedTracks = tracks.filter(track => track.id !== id);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
    } catch (err) {
      setError('Failed to delete track');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.spotifyUrl || !formData.name || !formData.artist) {
      setError('Please enter a valid Spotify URL and wait for track details to load');
      return;
    }

    try {
      let updatedTracks: Track[];
      
      if (editingId) {
        updatedTracks = tracks.map(track => 
          track.id === editingId 
            ? { ...formData, id: track.id }
            : track
        );
      } else {
        const newTrack: Track = {
          ...formData,
          id: Date.now().toString(),
        };
        updatedTracks = [...tracks, newTrack];
      }
      
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
      handleClose();
    } catch (err) {
      setError('Failed to save track');
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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
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
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress sx={{ color: '#02FF95' }} />
              </Box>
            )}
            {formData.name && (
              <Box sx={{ my: 2, p: 2, backgroundColor: '#1e1e1e', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ color: '#02FF95' }}>
                  Track Details:
                </Typography>
                <Typography sx={{ color: '#FFF' }}>
                  {formData.name} - {formData.artist}
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
              disabled={loading || !formData.name}
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
