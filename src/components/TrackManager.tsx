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
  InputLabel,
  Pagination
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

interface Track {
  id: string;
  title: string;
  remixer: {
    id: string;
    name: string;
    image: string;
  } | null;
  duration: number;
  spotifyUrl: string;
}

const LABELS = [
  { id: 'buildit-records', name: 'Build It Records' },
  { id: 'buildit-tech', name: 'Build It Tech' },
  { id: 'buildit-deep', name: 'Build It Deep' }
];

const TRACKS_PER_PAGE = 50;

const TrackManager: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('buildit-records');
  const [page, setPage] = useState(1);
  const [displayedTracks, setDisplayedTracks] = useState<Array<{ track: Track; release: Release }>>([]);
  const [totalTracks, setTotalTracks] = useState(0);

  useEffect(() => {
    if (selectedLabel) {
      fetchReleases();
    }
  }, [selectedLabel]);

  useEffect(() => {
    // Reset to first page when releases or label changes
    setPage(1);
    updateDisplayedTracks(1);
  }, [releases, selectedLabel]);

  useEffect(() => {
    // Update total tracks count
    const total = releases.reduce((sum, release) => sum + release.tracks.length, 0);
    setTotalTracks(total);
  }, [releases]);

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

  const updateDisplayedTracks = (currentPage: number) => {
    // Flatten all tracks with their release info
    const allTracks = releases.flatMap(release =>
      release.tracks.map(track => ({
        track,
        release
      }))
    );

    // Calculate pagination
    const startIndex = (currentPage - 1) * TRACKS_PER_PAGE;
    const endIndex = startIndex + TRACKS_PER_PAGE;
    
    setDisplayedTracks(allTracks.slice(startIndex, endIndex));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    updateDisplayedTracks(value);
  };

  const totalPages = Math.ceil(totalTracks / TRACKS_PER_PAGE);

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
        <Paper sx={{ p: 3, bgcolor: '#1e1e1e' }}>
          <Typography variant="h6" gutterBottom>
            Track Manager
          </Typography>

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
                {displayedTracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: '#fff' }}>
                      No releases found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTracks.map(({ track, release }) => (
                    <TableRow key={track.id}>
                      <TableCell>
                        <img
                          src={release.coverImage}
                          alt={release.title}
                          style={{ width: 50, height: 50, borderRadius: '4px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{track.title}</TableCell>
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

          {totalPages > 1 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2, textAlign: 'right' }}>
            Showing {displayedTracks.length} of {totalTracks} tracks
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TrackManager;
