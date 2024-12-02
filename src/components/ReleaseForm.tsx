import React, { useState, FormEvent, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormSubmission, ReleaseFormData } from '../hooks/useFormSubmission';
import { fetchTrackDetails } from '../utils/spotifyUtils';
import { isValidSpotifyUrl } from '../utils/spotifyUtils';
import { RECORD_LABELS } from '../constants/labels';

interface ReleaseFormProps {
  label: 'records' | 'tech' | 'deep';
}

export const ReleaseForm: React.FC<ReleaseFormProps> = ({ label }) => {
  const [releaseDate, setReleaseDate] = useState<Date | null>(null);
  const { handleSubmit, isSubmitting, submitError } = useFormSubmission();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReleaseFormData>({
    title: '',
    artist: '',
    imageUrl: '',
    releaseDate: new Date().toISOString(),
    spotifyUrl: '',
    beatportUrl: '',
    soundcloudUrl: '',
    label,
    genre: '',
  });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill form when Spotify URL is entered
    if (name === 'spotifyUrl' && value) {
      try {
        if (!isValidSpotifyUrl(value)) {
          setError('Please enter a valid Spotify track URL (e.g., https://open.spotify.com/track/...)');
          return;
        }
        
        setLoading(true);
        setError(null);
        const trackDetails = await fetchTrackDetails(value);
        setFormData(prev => ({
          ...prev,
          title: trackDetails.trackTitle,
          artist: trackDetails.artist,
          imageUrl: trackDetails.album?.images[0]?.url || '',
          releaseDate: trackDetails.album?.releaseDate || new Date().toISOString(),
        }));
        setReleaseDate(trackDetails.album?.releaseDate ? new Date(trackDetails.album.releaseDate) : null);
      } catch (err) {
        console.error('Error fetching track details:', err);
        setError('Failed to fetch track details from Spotify. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setReleaseDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        releaseDate: date.toISOString(),
      }));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleSubmit(formData);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#FFFFFF' }}>
        Submit a Release
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          fullWidth
          label="Spotify URL"
          name="spotifyUrl"
          value={formData.spotifyUrl}
          onChange={handleInputChange}
          disabled={loading}
          sx={{
            '& .MuiInputLabel-root': { color: '#AAAAAA' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#AAAAAA' },
              '&:hover fieldset': { borderColor: '#FFFFFF' },
              '&.Mui-focused fieldset': { borderColor: '#02FF95' }
            },
            '& input': { color: '#FFFFFF' }
          }}
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <TextField
          fullWidth
          required
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          disabled={loading}
          sx={{
            '& .MuiInputLabel-root': { color: '#AAAAAA' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#AAAAAA' },
              '&:hover fieldset': { borderColor: '#FFFFFF' },
              '&.Mui-focused fieldset': { borderColor: '#02FF95' }
            },
            '& input': { color: '#FFFFFF' }
          }}
        />

        <TextField
          fullWidth
          required
          label="Artist"
          name="artist"
          value={formData.artist}
          onChange={handleInputChange}
          disabled={loading}
          sx={{
            '& .MuiInputLabel-root': { color: '#AAAAAA' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#AAAAAA' },
              '&:hover fieldset': { borderColor: '#FFFFFF' },
              '&.Mui-focused fieldset': { borderColor: '#02FF95' }
            },
            '& input': { color: '#FFFFFF' }
          }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Release Date"
            value={releaseDate}
            onChange={handleDateChange}
            disabled={loading}
            sx={{
              '& .MuiInputLabel-root': { color: '#AAAAAA' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#AAAAAA' },
                '&:hover fieldset': { borderColor: '#FFFFFF' },
                '&.Mui-focused fieldset': { borderColor: '#02FF95' }
              },
              '& input': { color: '#FFFFFF' }
            }}
          />
        </LocalizationProvider>

        <FormControl fullWidth>
          <InputLabel sx={{ color: '#AAAAAA' }}>Genre</InputLabel>
          <Select
            name="genre"
            value={formData.genre}
            onChange={handleSelectChange}
            disabled={loading}
            sx={{
              color: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFFFFF' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#02FF95' }
            }}
          >
            <MenuItem value="house">House</MenuItem>
            <MenuItem value="techno">Techno</MenuItem>
            <MenuItem value="deep-house">Deep House</MenuItem>
            <MenuItem value="tech-house">Tech House</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Beatport URL"
          name="beatportUrl"
          value={formData.beatportUrl}
          onChange={handleInputChange}
          disabled={loading}
          sx={{
            '& .MuiInputLabel-root': { color: '#AAAAAA' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#AAAAAA' },
              '&:hover fieldset': { borderColor: '#FFFFFF' },
              '&.Mui-focused fieldset': { borderColor: '#02FF95' }
            },
            '& input': { color: '#FFFFFF' }
          }}
        />

        <TextField
          fullWidth
          label="SoundCloud URL"
          name="soundcloudUrl"
          value={formData.soundcloudUrl}
          onChange={handleInputChange}
          disabled={loading}
          sx={{
            '& .MuiInputLabel-root': { color: '#AAAAAA' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#AAAAAA' },
              '&:hover fieldset': { borderColor: '#FFFFFF' },
              '&.Mui-focused fieldset': { borderColor: '#02FF95' }
            },
            '& input': { color: '#FFFFFF' }
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || loading}
          sx={{
            backgroundColor: '#02FF95',
            color: '#000000',
            '&:hover': {
              backgroundColor: '#00CC75'
            }
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Release'}
        </Button>

        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default ReleaseForm;
