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
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Track, SpotifyApiTrack } from '../types/track';
import { fetchTrackDetails } from '../utils/spotifyUtils';

interface AdminTrackListProps {
  tracks: Track[];
  onDeleteTrack?: (trackId: string) => void;
  onEditTrack?: (track: Track) => void;
}

const AdminTrackList: React.FC<AdminTrackListProps> = ({ tracks, onDeleteTrack, onEditTrack }) => {
  const [trackDetails, setTrackDetails] = useState<Record<string, Track>>({});
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
  }, [tracks, loading, trackDetails]);

  const handleDeleteClick = (trackId: string) => {
    setTrackToDelete(trackId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (trackToDelete) {
      onDeleteTrack?.(trackToDelete);
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
      <List>
        {tracks.map((track) => (
          <ListItem
            key={track.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <Box
              component="img"
              src={track.albumCover || '/placeholder-album.jpg'}
              alt={`${track.trackTitle} album cover`}
              sx={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                marginRight: 2,
                borderRadius: 1
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" component="div">
                {track.trackTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {track.artist}
              </Typography>
            </Box>
            <Box>
              {onEditTrack && (
                <IconButton
                  onClick={() => onEditTrack(track)}
                  size="small"
                  sx={{ marginRight: 1 }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDeleteTrack && (
                <IconButton
                  onClick={() => handleDeleteClick(track.id)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this track?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminTrackList;
