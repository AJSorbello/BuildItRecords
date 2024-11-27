import React, { useState, FormEvent } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormSubmission, ReleaseFormData } from '../hooks/useFormSubmission';

interface ReleaseFormProps {
  label: 'records' | 'tech' | 'deep';
}

export const ReleaseForm: React.FC<ReleaseFormProps> = ({ label }) => {
  const [releaseDate, setReleaseDate] = useState<Date | null>(null);
  const { handleSubmit, isSubmitting, submitError } = useFormSubmission();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleSubmit({
        ...formData,
        releaseDate: releaseDate?.toISOString() || new Date().toISOString(),
      });
      // Reset form after successful submission
      setFormData({
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
      setReleaseDate(null);
    } catch (error) {
      // Error is handled by the hook
      console.error('Form submission failed:', error);
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        p: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
      }}
    >
      <form onSubmit={onSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Submit Release
          </Typography>

          <TextField
            required
            name="title"
            label="Title"
            value={formData.title}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />

          <TextField
            required
            name="artist"
            label="Artist"
            value={formData.artist}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Release Date"
              value={releaseDate}
              onChange={(newValue) => {
                setReleaseDate(newValue);
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            name="imageUrl"
            label="Artwork URL"
            value={formData.imageUrl}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />

          <TextField
            name="spotifyUrl"
            label="Spotify URL"
            value={formData.spotifyUrl}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />

          <TextField
            name="beatportUrl"
            label="Beatport URL"
            value={formData.beatportUrl}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />

          <TextField
            name="soundcloudUrl"
            label="SoundCloud URL"
            value={formData.soundcloudUrl}
            onChange={handleInputChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />

          <FormControl>
            <InputLabel id="genre-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Genre
            </InputLabel>
            <Select
              labelId="genre-label"
              name="genre"
              label="Genre"
              value={formData.genre}
              onChange={handleSelectChange}
              sx={{
                color: '#FFFFFF',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              <MenuItem value="house">House</MenuItem>
              <MenuItem value="techno">Techno</MenuItem>
              <MenuItem value="deep-house">Deep House</MenuItem>
              <MenuItem value="tech-house">Tech House</MenuItem>
              <MenuItem value="minimal">Minimal</MenuItem>
              <MenuItem value="progressive">Progressive</MenuItem>
            </Select>
          </FormControl>

          {submitError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {submitError}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              mt: 2,
              backgroundColor: '#1DB954',
              '&:hover': {
                backgroundColor: '#1aa34a',
              },
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Release'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};
