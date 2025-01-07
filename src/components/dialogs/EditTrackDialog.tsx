import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';
import { Track } from '../../types/track';

interface EditTrackDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (track: Track) => Promise<void>;
  formData: {
    id: string;
    trackTitle: string;
    artist: string;
    album: string;
    releaseDate: string;
    albumCover: string;
    spotifyUrl: string;
    previewUrl: string;
    beatportUrl: string;
    soundcloudUrl: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const EditTrackDialog: React.FC<EditTrackDialogProps> = ({
  open,
  onClose,
  onSave,
  formData,
  setFormData
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const track: Track = {
        id: formData.id,
        name: formData.trackTitle,
        artists: formData.artist.split(',').map(a => a.trim()),
        album: {
          name: formData.album,
          artwork_url: formData.albumCover
        },
        releaseDate: formData.releaseDate,
        albumCover: formData.albumCover,
        spotifyUrl: formData.spotifyUrl,
        preview_url: formData.previewUrl,
        beatportUrl: formData.beatportUrl,
        soundcloudUrl: formData.soundcloudUrl
      };
      await onSave(track);
      onClose();
    } catch (error) {
      console.error('Error saving track:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Track</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="trackTitle"
              label="Track Title"
              value={formData.trackTitle}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="artist"
              label="Artist(s)"
              value={formData.artist}
              onChange={handleChange}
              fullWidth
              helperText="Separate multiple artists with commas"
            />
            <TextField
              name="album"
              label="Album"
              value={formData.album}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="releaseDate"
              label="Release Date"
              type="date"
              value={formData.releaseDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="albumCover"
              label="Album Cover URL"
              value={formData.albumCover}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="spotifyUrl"
              label="Spotify URL"
              value={formData.spotifyUrl}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="previewUrl"
              label="Preview URL"
              value={formData.previewUrl}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="beatportUrl"
              label="Beatport URL"
              value={formData.beatportUrl}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="soundcloudUrl"
              label="SoundCloud URL"
              value={formData.soundcloudUrl}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditTrackDialog;
