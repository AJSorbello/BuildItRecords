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
  title: '',
  artist: {
    id: '',
    name: '',
    spotifyUrl: '',
    recordLabel: RecordLabel.RECORDS
  },
  recordLabel: RecordLabel.RECORDS,
  artwork: '',
  spotifyUrl: '',
  beatportUrl: '',
  releaseDate: new Date().toISOString(),
  albumCover: ''
};

const initialFetchState: FetchState = {
  loading: false,
  error: null
};

const transformTracks = (tracks: Track[]): Track[] => {
  return tracks.map(track => ({
    ...track,
    id: track.id || '',
    title: track.title || '',
    artist: {
      id: track.artist.id || '',
      name: track.artist.name || 'Unknown Artist',
      spotifyUrl: track.artist.spotifyUrl || '',
      recordLabel: track.recordLabel
    },
    recordLabel: track.recordLabel || RecordLabel.RECORDS,
    artwork: track.artwork || '',
    spotifyUrl: track.spotifyUrl || '',
    beatportUrl: track.beatportUrl || '',
    releaseDate: track.releaseDate || new Date().toISOString(),
    albumCover: track.albumCover || ''
  }));
};

const getArtistString = (artist: SimpleArtist): string => {
  return artist.name || 'Unknown Artist';
};

export const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedRecordLabel, setSelectedRecordLabel] = useState<RecordLabel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);

  useEffect(() => {
    fetchTracks();
  }, [selectedRecordLabel]);

  const fetchTracks = async () => {
    try {
      setFetchState({ loading: true, error: null });
      const allTracks = await databaseService.getTracks(
        selectedRecordLabel === 'All' ? RecordLabel.RECORDS : selectedRecordLabel
      );
      const processedTracks = transformTracks(allTracks);
      setTracks(processedTracks);
      setFetchState({ loading: false, error: null });
    } catch (err) {
      setFetchState({ loading: false, error: err instanceof Error ? err.message : 'Failed to load tracks' });
    }
  };

  const handleLabelChange = (event: any) => {
    setSelectedRecordLabel(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filterTracks = (tracks: Track[]): Track[] => {
    const searchLower = searchQuery.toLowerCase();
    const selectedLabel = selectedRecordLabel as RecordLabel;

    return tracks.filter(track => {
      const matchesSearch = !searchQuery || (
        track.title.toLowerCase().includes(searchLower) ||
        track.artist.name.toLowerCase().includes(searchLower)
      );

      const matchesLabel = !selectedLabel || track.recordLabel === selectedLabel;

      return matchesSearch && matchesLabel;
    });
  };

  const filteredTracks = useMemo(() => {
    return filterTracks(tracks);
  }, [tracks, searchQuery, selectedRecordLabel]);

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
            value={selectedRecordLabel}
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
                <TableCell>{track.title}</TableCell>
                <TableCell>{track.artist.name}</TableCell>
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
