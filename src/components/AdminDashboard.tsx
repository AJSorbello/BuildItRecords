import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Link,
  SelectChangeEvent
} from '@mui/material';
import { RecordLabel, LABEL_DISPLAY_NAMES } from '../constants/labels';
import type { Track } from '../types/track';
import type { Album, Release } from '../types/release';
import type { Artist } from '../types/artist';
import { databaseService } from '../services/DatabaseService';

interface FetchState {
  loading: boolean;
  error: string | null;
}

const initialFetchState: FetchState = {
  loading: false,
  error: null,
};

const convertReleaseToTrack = (release: Release): Track => {
  const defaultArtist: Artist = {
    id: '',
    name: release.artist,
    genres: [],
    images: [],
    followers: { total: 0 },
    external_urls: { spotify: '' },
    uri: '',
    popularity: 0
  };

  return {
    id: release.id,
    title: release.name,
    name: release.name,
    artists: [{ 
      id: '', 
      name: release.artist,
      external_urls: {
        spotify: release.external_urls.spotify
      }
    }],
    album: release,
    duration_ms: 0,
    external_urls: release.external_urls,
    preview_url: null,
    uri: release.uri,
    popularity: 0,
    featured: false,
    artworkUrl: release.images[0]?.url,
    releaseDate: release.release_date,
    label: release.album_type === 'album' ? RecordLabel.RECORDS : RecordLabel.TECH,
    spotifyUrl: release.external_urls.spotify
  };
};

export const AdminDashboard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedRecordLabel, setSelectedRecordLabel] = useState<RecordLabel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);

  const fetchTracks = useCallback(async () => {
    try {
      setFetchState({ loading: true, error: null });
      let fetchedTracks: Track[];
      
      if (selectedRecordLabel === 'All') {
        const allTracks = await databaseService.getTracksFromApi();
        fetchedTracks = allTracks;
      } else {
        const releases = await databaseService.getReleasesByLabel(selectedRecordLabel);
        fetchedTracks = releases.map(convertReleaseToTrack);
      }
      
      setTracks(fetchedTracks);
      setFetchState({ loading: false, error: null });
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setFetchState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tracks' 
      });
    }
  }, [selectedRecordLabel]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleLabelChange = (event: SelectChangeEvent<RecordLabel | 'All'>) => {
    setSelectedRecordLabel(event.target.value as RecordLabel | 'All');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredTracks = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return tracks.filter((track) => {
      const matchesSearch = !searchQuery || 
        track.title.toLowerCase().includes(searchLower) || 
        track.artists.some((artist) => artist.name.toLowerCase().includes(searchLower));
      
      const matchesLabel = selectedRecordLabel === 'All' || track.label === selectedRecordLabel;

      return matchesSearch && matchesLabel;
    });
  }, [tracks, searchQuery, selectedRecordLabel]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Record Label</InputLabel>
            <Select<RecordLabel | 'All'>
              value={selectedRecordLabel}
              label="Record Label"
              onChange={handleLabelChange}
            >
              <MenuItem value="All">All Labels</MenuItem>
              {Object.entries(LABEL_DISPLAY_NAMES).map(([key, name]) => (
                <MenuItem key={key} value={key as RecordLabel}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search tracks"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title or artist..."
          />
        </Grid>
      </Grid>

      {fetchState.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {fetchState.error}
        </Typography>
      )}

      {fetchState.loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Label</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell>{track.title}</TableCell>
                  <TableCell>
                    {track.artists.map((artist) => artist.name).join(', ') || 'Unknown Artist'}
                  </TableCell>
                  <TableCell>
                    {track.label ? LABEL_DISPLAY_NAMES[track.label as RecordLabel] : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {track.spotifyUrl && (
                      <Button
                        component={Link}
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        Open in Spotify
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AdminDashboard;
