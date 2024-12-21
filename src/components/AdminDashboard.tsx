import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import { RecordLabel, RECORD_LABELS, LABEL_DISPLAY_NAMES } from '../constants/labels';
import { Track } from '../types/track';
import type { Artist, SimpleArtist } from '../types/artist';
import { databaseService } from '../services/DatabaseService';

interface FetchState {
  loading: boolean;
  error: string | null;
}

const initialTrack: Track = {
  id: '',
  name: '',
  trackTitle: '',
  artist: {
    id: '',
    name: '',
    spotifyUrl: '',
    recordLabel: RecordLabel.RECORDS
  },
  artists: [],
  album: {
    id: '',
    name: '',
    releaseDate: new Date().toISOString(),
    totalTracks: 0,
    images: []
  },
  releaseDate: new Date().toISOString(),
  imageUrl: '',
  spotifyUrl: '',
  previewUrl: '',
  recordLabel: RecordLabel.RECORDS
};

const initialFetchState: FetchState = {
  loading: false,
  error: null
};

const getArtistString = (artist: SimpleArtist): string => {
  return artist.name || 'Unknown Artist';
};

export const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<RecordLabel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);

  useEffect(() => {
    fetchTracks();
  }, [selectedLabel]);

  const fetchTracks = async () => {
    try {
      setFetchState({ loading: true, error: null });
      const allTracks = await databaseService.getTracks(
        selectedLabel === 'All' ? RecordLabel.RECORDS : selectedLabel
      );
      const processedTracks = processTracksEfficiently(allTracks);
      setTracks(processedTracks);
      setFetchState({ loading: false, error: null });
    } catch (err) {
      setFetchState({ loading: false, error: err instanceof Error ? err.message : 'Failed to load tracks' });
    }
  };

  const handleLabelChange = (event: any) => {
    setSelectedLabel(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const processTracksEfficiently = (tracks: Track[]): Track[] => {
    return tracks.map(track => ({
      ...track,
      id: track.id || '',
      name: track.name || track.trackTitle || '',
      trackTitle: track.trackTitle || track.name || '',
      artist: track.artist || { 
        id: '', 
        name: 'Unknown Artist', 
        spotifyUrl: '', 
        recordLabel: track.recordLabel 
      },
      artists: track.artists || [],
      album: track.album || {
        id: '',
        name: '',
        releaseDate: track.releaseDate || new Date().toISOString(),
        totalTracks: 0,
        images: []
      },
      releaseDate: track.releaseDate || new Date().toISOString(),
      imageUrl: track.imageUrl || '',
      spotifyUrl: track.spotifyUrl || '',
      previewUrl: track.previewUrl || '',
      recordLabel: track.recordLabel || RecordLabel.RECORDS
    }));
  };

  const filterTracks = (track: Track): boolean => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const artistName = getArtistString(track.artist);

    const matchesSearch = !searchQuery || (
      (track.trackTitle || track.name || '').toLowerCase().includes(searchLower) ||
      artistName.toLowerCase().includes(searchLower)
    );

    return matchesSearch;
  };

  const filteredTracks = useMemo(() => {
    return tracks.filter(filterTracks);
  }, [tracks, searchQuery]);

  if (fetchState.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchState.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {fetchState.error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Track Management
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ m: 1, minWidth: 200 }}>
          <InputLabel>Label</InputLabel>
          <Select
            value={selectedLabel}
            onChange={handleLabelChange}
            label="Label"
          >
            <MenuItem value="All">All Labels</MenuItem>
            <MenuItem value={RecordLabel.RECORDS}>{LABEL_DISPLAY_NAMES[RecordLabel.RECORDS]}</MenuItem>
            <MenuItem value={RecordLabel.TECH}>{LABEL_DISPLAY_NAMES[RecordLabel.TECH]}</MenuItem>
            <MenuItem value={RecordLabel.DEEP}>{LABEL_DISPLAY_NAMES[RecordLabel.DEEP]}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Search Tracks"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ m: 1, minWidth: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Release Date</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell>{track.trackTitle || track.name}</TableCell>
                <TableCell>{getArtistString(track.artist)}</TableCell>
                <TableCell>{new Date(track.releaseDate).toLocaleDateString()}</TableCell>
                <TableCell>{LABEL_DISPLAY_NAMES[track.recordLabel]}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => {}}>Edit</Button>
                  <Button color="error" onClick={() => {}}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminDashboard;
