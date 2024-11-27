import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  spotifyUrl: string;
  category: string;
  albumArt: string;
}

interface TrackFormData {
  name: string;
  artist: string;
  album: string;
  spotifyUrl: string;
  category: string;
}

const initialFormData: TrackFormData = {
  name: '',
  artist: '',
  album: '',
  spotifyUrl: '',
  category: '',
};

const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<TrackFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/track-management/tracks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTracks(response.data.tracks);
    } catch (err) {
      setError('Failed to fetch tracks');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (track: Track) => {
    setFormData({
      name: track.name,
      artist: track.artist,
      album: track.album,
      spotifyUrl: track.spotifyUrl,
      category: track.category,
    });
    setEditingId(track.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/track-management/tracks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTracks();
    } catch (err) {
      setError('Failed to delete track');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    try {
      if (editingId) {
        await axios.put(
          `/api/track-management/tracks/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          '/api/track-management/tracks',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      handleClose();
      await fetchTracks();
    } catch (err) {
      setError('Failed to save track');
    }
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Track Management
        </Typography>
        <Button variant="contained" onClick={handleOpen}>
          Add New Track
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Album</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell>{track.name}</TableCell>
                <TableCell>{track.artist}</TableCell>
                <TableCell>{track.album}</TableCell>
                <TableCell>{track.category}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(track)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(track.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingId ? 'Edit Track' : 'Add New Track'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Track Name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Artist"
              name="artist"
              value={formData.artist}
              onChange={handleTextChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Album"
              name="album"
              value={formData.album}
              onChange={handleTextChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Spotify URL"
              name="spotifyUrl"
              value={formData.spotifyUrl}
              onChange={handleTextChange}
              required
              helperText="Enter the full Spotify track URL"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleSelectChange}
                required
              >
                <MenuItem value="Featured">Featured</MenuItem>
                <MenuItem value="New Release">New Release</MenuItem>
                <MenuItem value="Popular">Popular</MenuItem>
                <MenuItem value="Recommended">Recommended</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Add'} Track
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
