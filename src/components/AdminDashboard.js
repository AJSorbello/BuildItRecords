import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const AdminDashboard = () => {
  const [tracks, setTracks] = useState([]);
  const [newTrack, setNewTrack] = useState({ spotifyUrl: '', category: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editTrack, setEditTrack] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  const categories = ['Featured', 'New Release', 'Popular', 'Recommended'];

  useEffect(() => {
    fetchTracks();
    verifyAdmin();
  }, []);

  const verifyAdmin = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      await axios.get('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      navigate('/admin/login');
    }
  };

  const fetchTracks = async () => {
    try {
      const response = await axios.get('/api/track-management/tracks');
      setTracks(response.data.tracks);
    } catch (err) {
      setError('Failed to fetch tracks');
    }
  };

  const handleAddTrack = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('/api/track-management/tracks', newTrack, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTrack({ spotifyUrl: '', category: '' });
      setSuccess('Track added successfully');
      fetchTracks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add track');
    }
  };

  const handleDeleteTrack = async (trackId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/track-management/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Track deleted successfully');
      fetchTracks();
    } catch (err) {
      setError('Failed to delete track');
    }
  };

  const handleEditClick = (track) => {
    setEditTrack(track);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/track-management/tracks/${editTrack.id}`, 
        { category: editTrack.category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Track updated successfully');
      setIsEditDialogOpen(false);
      fetchTracks();
    } catch (err) {
      setError('Failed to update track');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin/login');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Track Management
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleAddTrack} sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Spotify Track URL"
              value={newTrack.spotifyUrl}
              onChange={(e) => setNewTrack(prev => ({ ...prev, spotifyUrl: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newTrack.category}
                label="Category"
                onChange={(e) => setNewTrack(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" fullWidth>
              Add Track
            </Button>
          </Box>

          <List>
            {tracks.map((track) => (
              <ListItem key={track.id} divider>
                <ListItemText
                  primary={`${track.name} - ${track.artist}`}
                  secondary={`Category: ${track.category}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleEditClick(track)} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteTrack(track.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Track Category</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={editTrack?.category || ''}
              label="Category"
              onChange={(e) => setEditTrack(prev => ({ ...prev, category: e.target.value }))}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
