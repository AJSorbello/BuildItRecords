import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  IconButton, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Track } from '../types/track';
import { fetchTrackDetails } from '../utils/spotifyUtils';
import { SpotifyTrack } from '../types/spotify';

interface AdminTrackListProps {
  tracks: Track[];
  onDeleteTrack: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
}

const AdminTrackList: React.FC<AdminTrackListProps> = ({ tracks, onDeleteTrack, onEditTrack }) => {
  const [trackDetails, setTrackDetails] = useState<Record<string, SpotifyTrack>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllTrackDetails = async () => {
      for (const track of tracks) {
        if (!trackDetails[track.id] && !loading[track.id]) {
          setLoading(prev => ({ ...prev, [track.id]: true }));
          try {
            const details = await fetchTrackDetails(track.spotifyUrl);
            setTrackDetails(prev => ({ ...prev, [track.id]: details }));
          } catch (error) {
            console.error(`Error fetching details for track ${track.id}:`, error);
          } finally {
            setLoading(prev => ({ ...prev, [track.id]: false }));
          }
        }
      }
    };

    fetchAllTrackDetails();
  }, [tracks]);

  const handleDeleteClick = (trackId: string) => {
    setTrackToDelete(trackId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (trackToDelete) {
      onDeleteTrack(trackToDelete);
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTrackToDelete(null);
  };

  if (!tracks || tracks.length === 0) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: '#AAAAAA' }}>
          No tracks available
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={4}>
        {tracks.map((track) => (
          <Grid item xs={12} sm={6} md={4} key={track.id}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              transition: 'all 0.2s ease-in-out'
            }}>
              <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                {loading[track.id] ? (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)'
                  }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <CardMedia
                    component="img"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    image={trackDetails[track.id]?.album?.images[0]?.url || `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(track.trackTitle)}`}
                    alt={track.trackTitle}
                  />
                )}
              </Box>
              <CardContent>
                <Typography variant="h6" component="div" sx={{ color: '#FFFFFF', mb: 1 }}>
                  {track.trackTitle}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#AAAAAA', mb: 2 }}>
                  {track.artist}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <IconButton 
                    onClick={() => onEditTrack(track)}
                    sx={{ color: '#FFFFFF' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteClick(track.id)}
                    sx={{ color: '#FF4444' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this track? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminTrackList;
