import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import { spotifyService } from '../../services/SpotifyService';
import { Track } from '../../types/track';

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
      <TextField
        fullWidth
        label="Spotify Track URL"
        value={spotifyUrl}
        onChange={(e) => setSpotifyUrl(e.target.value)}
        error={!!error}
        helperText={error || 'Enter the Spotify URL of the track'}
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
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
