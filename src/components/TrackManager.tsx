import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { API_URL } from '../config';

interface Release {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistImage: string;
  releaseDate: string;
  coverImage: string;
  spotifyUrl: string;
  tracks: Array<{
    id: string;
    title: string;
    remixer: {
      id: string;
      name: string;
      image: string;
    } | null;
    duration: number;
    spotifyUrl: string;
  }>;
}

const LABELS = [
  { id: 'buildit-records', name: 'Build It Records' },
  { id: 'buildit-tech', name: 'Build It Tech' },
  { id: 'buildit-deep', name: 'Build It Deep' }
];

const TrackManager: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('buildit-records');

  useEffect(() => {
    if (selectedLabel) {
      fetchReleases();
    }
  }, [selectedLabel]);

  const fetchReleases = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching releases for label:', selectedLabel);
      const response = await fetch(`${API_URL}/releases/${selectedLabel}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch releases');
      }

      console.log('Fetched releases:', data);
      setReleases(data.releases || []);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
      setReleases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedLabel(event.target.value as string);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <Typography variant="h5" gutterBottom>
        Track Management
      </Typography>

      <FormControl sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel id="label-select-label">Label</InputLabel>
        <Select
          labelId="label-select-label"
          value={selectedLabel}
          onChange={handleLabelChange}
          label="Label"
        >
          {LABELS.map(label => (
            <MenuItem key={label.id} value={label.id}>
              {label.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#1e1e1e' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Cover</TableCell>
                <TableCell sx={{ color: '#fff' }}>Title</TableCell>
                <TableCell sx={{ color: '#fff' }}>Artist</TableCell>
                <TableCell sx={{ color: '#fff' }}>Release Date</TableCell>
                <TableCell sx={{ color: '#fff' }}>Total Tracks</TableCell>
                <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {releases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: '#fff' }}>
                    No releases found
                  </TableCell>
                </TableRow>
              ) : (
                releases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>
                      <img
                        src={release.coverImage}
                        alt={release.title}
                        style={{ width: 50, height: 50, borderRadius: '4px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{release.title}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{release.artist}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{release.tracks.length}</TableCell>
                    <TableCell>
                      <IconButton
                        href={release.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#1DB954' }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TrackManager;
