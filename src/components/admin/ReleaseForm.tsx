import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { spotifyService } from '../../services/SpotifyService';
import { Track } from '../../types/models';
import { DatabaseError } from '../../utils/errors';

interface ReleaseFormProps {
  onSubmit: (track: Track) => void;
  onCancel: () => void;
}

const ReleaseForm: React.FC<ReleaseFormProps> = ({ onSubmit, onCancel }) => {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidSpotifyUrl = (url: string): boolean => {
    return url.includes('spotify.com/track/');
  };

  const extractTrackId = (url: string): string | null => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidSpotifyUrl(spotifyUrl)) {
      setError('Please enter a valid Spotify track URL');
      return;
    }

    const trackId = extractTrackId(spotifyUrl);
    if (!trackId) {
      setError('Could not extract track ID from URL');
      return;
    }

    setLoading(true);
    try {
      const track = await spotifyService.getTrack(trackId);
      if (!track) {
        throw new Error('Failed to fetch track details');
      }
      onSubmit(track);
    } catch (err) {
      console.error('Error fetching track:', err);
      if (err instanceof DatabaseError) {
        setError(err.message);
      } else {
        setError('Failed to fetch track details');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <TextField
        fullWidth
        label="Spotify Track URL"
        value={spotifyUrl}
        onChange={(e) => setSpotifyUrl(e.target.value)}
        placeholder="https://open.spotify.com/track/..."
        error={!!error}
        disabled={loading}
      />
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !spotifyUrl}
        >
          {loading ? <CircularProgress size={24} /> : 'Add Track'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReleaseForm;
