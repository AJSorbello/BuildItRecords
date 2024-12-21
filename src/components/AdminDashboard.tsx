import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid
} from '@mui/material';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { Track } from '../types/track';
import type { Artist } from '../types/artist';
import { databaseService } from '../services/DatabaseService';
import { processTracksEfficiently } from '../utils/trackUtils';

interface TrackFormData {
  title: string;
  artist: string;
  releaseDate: string;
  imageUrl: string;
  spotifyUrl: string;
  recordLabel: RecordLabel;
  labels: RecordLabel[];
}

interface FetchState {
  loading: boolean;
  error: string | null;
}

const initialFormData: TrackFormData = {
  title: '',
  artist: '',
  releaseDate: new Date().toISOString().split('T')[0],
  imageUrl: '',
  spotifyUrl: '',
  recordLabel: RECORD_LABELS['Build It Records'],
  labels: [RECORD_LABELS['Build It Records']]
};

const initialFetchState: FetchState = {
  loading: false,
  error: null
};

interface ImportProgress {
  current: number;
  total: number;
  message: string;
}

const AdminDashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TrackFormData>(initialFormData);
  const [fetchState, setFetchState] = useState<FetchState>(initialFetchState);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLabel, setImportLabel] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<RecordLabel | 'All'>('All');
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tracksPerPage, setTracksPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Function to load tracks from database
  const loadTracks = useCallback(async () => {
    try {
      setFetchState({ loading: true, error: null });
      const allTracks = await databaseService.getAllTracks(
        selectedLabel === 'All' ? RECORD_LABELS['Build It Records'] : selectedLabel
      );
      const processedTracks = processTracksEfficiently(allTracks);
      setTracks(processedTracks);
      setFetchState({ loading: false, error: null });
    } catch (error) {
      console.error('Error loading tracks:', error);
      setFetchState({ 
        loading: false, 
        error: 'Failed to load tracks from database' 
      });
    }
  }, [selectedLabel]);

  // Load tracks when component mounts or selectedLabel changes
  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const getArtistName = (artist: string | Artist): string => {
    if (typeof artist === 'string') return artist;
    return artist?.name || '';
  };

  const formatLabelForSpotify = (label: string): string => {
    return label.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const syncReleases = async (label: string) => {
    try {
      setSyncing(true);
      const labelKey = label === 'All' ? 'records' : 
        Object.entries(RECORD_LABELS).find(([key]) => 
          RECORD_LABELS[key as keyof typeof RECORD_LABELS] === label
        )?.[0]?.toLowerCase() || 'records';

      const formattedLabel = formatLabelForSpotify(labelKey);
      setSnackbarMessage(`Syncing ${formattedLabel} releases...`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      const response = await fetch(`/api/${labelKey}/releases/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync releases');
      }
      
      await loadTracks();
      
      setSnackbarMessage(`Successfully synced ${formattedLabel} releases`);
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error syncing releases:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to sync releases');
      setSnackbarSeverity('error');
    } finally {
      setSyncing(false);
      setSnackbarOpen(true);
    }
  };

  // Filter tracks based on search query and selected label
  const filteredTracks = (tracks || []).filter(track => {
    if (!track) return false;

    const searchLower = searchQuery.toLowerCase();
    const artistName = getArtistName(track.artist);

    const matchesSearch = !searchQuery || (
      (track.trackTitle || track.name || '').toLowerCase().includes(searchLower) ||
      artistName.toLowerCase().includes(searchLower)
    );
    
    const matchesLabel = 
      selectedLabel === 'All' || 
      track.recordLabel === selectedLabel;

    return matchesSearch && matchesLabel;
  });

  // Calculate pagination
  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack);

  const handlePageChange = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setCurrentPage(newPage + 1);
  };

  const handleLabelChange = (event: any) => {
    setSelectedLabel(event.target.value as RecordLabel | 'All');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <FormControl sx={{ mb: 2, minWidth: 200 }}>
          <InputLabel>Label</InputLabel>
          <Select
            value={selectedLabel}
            onChange={handleLabelChange}
            label="Label"
          >
            <MenuItem value="All">All Labels</MenuItem>
            <MenuItem value={RECORD_LABELS['Build It Records']}>Build It Records</MenuItem>
            <MenuItem value={RECORD_LABELS['Build It Tech']}>Build It Tech</MenuItem>
            <MenuItem value={RECORD_LABELS['Build It Deep']}>Build It Deep</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={() => syncReleases(selectedLabel === 'All' ? 'records' : selectedLabel.toLowerCase())}
          disabled={syncing}
          sx={{ ml: 2 }}
        >
          {syncing ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Syncing...
            </>
          ) : (
            'Sync Releases'
          )}
        </Button>

        <TextField
          label="Search Tracks"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ ml: 2, minWidth: 200 }}
        />

        <TableContainer component={Paper} sx={{ mt: 2 }}>
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
              {currentTracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell>{track.trackTitle || track.name}</TableCell>
                  <TableCell>{getArtistName(track.artist)}</TableCell>
                  <TableCell>{new Date(track.releaseDate).toLocaleDateString()}</TableCell>
                  <TableCell>{track.recordLabel}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {/* Add edit functionality */}}
                      size="small"
                    >
                      Edit
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredTracks.length}
          page={currentPage - 1}
          onPageChange={handlePageChange}
          rowsPerPage={tracksPerPage}
          onRowsPerPageChange={(event) => {
            setTracksPerPage(parseInt(event.target.value, 10));
            setCurrentPage(1);
          }}
        />

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
