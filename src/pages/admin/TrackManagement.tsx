import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { ImportStatus } from '../../components/ImportStatus';
import { useAuth } from '../../hooks/useAuth';
import { LABELS } from '../../config';

interface Track {
  id: string;
  title: string;
  releaseId: string;
  releaseName: string;
  artistName: string;
  duration: number;
  spotifyUrl: string;
  labelId: string;
}

export const TrackManagement: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(LABELS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement API call to fetch tracks
      // const response = await getTracks(selectedLabel);
      // setTracks(response);
    } catch (err) {
      setError('Failed to fetch tracks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTracks();
    }
  }, [isAuthenticated, selectedLabel]);

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLabel(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <Alert severity="error">
          Please log in to access track management.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Track Management
        </Typography>

        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Label"
                      value={selectedLabel}
                      onChange={handleLabelChange}
                    >
                      {LABELS.map((label) => (
                        <MenuItem key={label.id} value={label.id}>
                          {label.displayName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search Tracks"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search by title, artist, or release..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Import Status */}
          <Grid item xs={12}>
            <ImportStatus
              labelId={selectedLabel}
              onImportComplete={fetchTracks}
            />
          </Grid>

          {/* Tracks Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                {loading && <LinearProgress />}
                {error && <Alert severity="error">{error}</Alert>}

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Release</TableCell>
                        <TableCell>Artist</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell width={120}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tracks
                        .filter(track =>
                          searchQuery
                            ? track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              track.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              track.releaseName.toLowerCase().includes(searchQuery.toLowerCase())
                            : true
                        )
                        .map((track) => (
                          <TableRow key={track.id}>
                            <TableCell>{track.title}</TableCell>
                            <TableCell>{track.releaseName}</TableCell>
                            <TableCell>{track.artistName}</TableCell>
                            <TableCell>{formatDuration(track.duration)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => window.open(track.spotifyUrl, '_blank')}
                              >
                                <PlayIcon />
                              </IconButton>
                              <IconButton size="small">
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
