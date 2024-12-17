import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Pagination,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { Track, SpotifyApiTrack } from '../types/track';
import { RecordLabel } from '../constants/labels';
import AdminTrackList from './AdminTrackList';
import { spotifyService } from '../services/SpotifyService';
import { getData, resetData } from '../utils/dataInitializer';
import { extractSpotifyId, isValidSpotifyUrl, normalizeSpotifyUrl } from '../utils/spotifyUtils';

interface TrackFormData {
  id: string;
  trackTitle: string;
  artist: string;
  spotifyUrl: string;
  recordLabel: RecordLabel;
  albumCover: string;
  album: {
    name: string;
    releaseDate: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
  };
  releaseDate: string;
  previewUrl: string | null;
  beatportUrl: string;
  soundcloudUrl: string;
}

const initialFormData: TrackFormData = {
  id: '',
  trackTitle: '',
  artist: '',
  spotifyUrl: '',
  recordLabel: RECORD_LABELS.RECORDS,
  albumCover: '',
  album: {
    name: '',
    releaseDate: new Date().toISOString().split('T')[0],
    images: []
  },
  releaseDate: new Date().toISOString().split('T')[0],
  previewUrl: null,
  beatportUrl: '',
  soundcloudUrl: ''
};

interface FetchState {
  loading: boolean;
  error: string | null;
}

const initialFetchState: FetchState = {
  loading: false,
  error: null,
};

interface SpotifyTrackData {
  id: string;
  trackTitle: string;
  artist: string;
  recordLabel: RecordLabel;
  spotifyUrl: string;
  albumCover: string;
  album: {
    name: string;
    releaseDate: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
  };
  releaseDate: string;
  previewUrl: string | null;
}

const validateRecordLabel = (label: string): RecordLabel => {
  // Convert input to lowercase for comparison
  const lowerLabel = label.toLowerCase();
  
  // Check against lowercase versions of valid labels
  const validLabel = Object.values(RECORD_LABELS).find(
    validLabel => validLabel.toLowerCase() === lowerLabel
  );

  return validLabel || RECORD_LABELS.RECORDS; // Return the properly capitalized version or default
};

interface ImportProgress {
  imported: number;
  total: number;
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
  const [tracksPerPage] = useState(10);

  // Function to remove duplicates and sort tracks in a single pass
  const processTracksEfficiently = (tracksArray: Track[]): Track[] => {
    const trackMap = new Map<string, Track>();
    const duplicates: Track[] = [];
    
    // Single pass to handle duplicates and track the latest version
    tracksArray.forEach(track => {
      const normalizedUrl = normalizeSpotifyUrl(track.spotifyUrl);
      const existingTrack = trackMap.get(normalizedUrl);
      
      if (existingTrack) {
        // Keep the newer track based on releaseDate
        const existingDate = new Date(existingTrack.releaseDate).getTime();
        const newDate = new Date(track.releaseDate).getTime();
        
        if (newDate > existingDate) {
          duplicates.push(existingTrack);
          trackMap.set(normalizedUrl, track);
        } else {
          duplicates.push(track);
        }
      } else {
        trackMap.set(normalizedUrl, track);
      }
    });

    // Convert to array and sort in the same pass
    const result = Array.from(trackMap.values());
    result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    if (duplicates.length > 0) {
      console.log(`Found and processed ${duplicates.length} duplicate tracks:`, duplicates);
    }

    return result;
  };

  useEffect(() => {
    // Load tracks from localStorage with optimized processing
    const loadTracks = () => {
      try {
        const storedTracks = localStorage.getItem('tracks');
        if (!storedTracks) {
          console.log('No tracks found in localStorage, initializing empty array');
          localStorage.setItem('tracks', JSON.stringify([]));
          setTracks([]);
          return;
        }

        const parsedTracks = JSON.parse(storedTracks) as Track[];
        console.log('Loaded tracks from localStorage:', parsedTracks);
        
        // Process tracks efficiently in a single pass
        const processedTracks = processTracksEfficiently(parsedTracks);
        
        // Update localStorage if needed
        if (processedTracks.length !== parsedTracks.length) {
          console.log(`Processed ${parsedTracks.length - processedTracks.length} duplicate tracks`);
          localStorage.setItem('tracks', JSON.stringify(processedTracks));
        }
        
        setTracks(processedTracks);
      } catch (error) {
        console.error('Error loading tracks:', error);
        setTracks([]);
      }
    };

    loadTracks();
  }, []);

  // Function to clean duplicates manually with improved efficiency
  const cleanDuplicates = () => {
    const processedTracks = processTracksEfficiently(tracks);
    const removedCount = tracks.length - processedTracks.length;
    
    if (removedCount > 0) {
      setTracks(processedTracks);
      localStorage.setItem('tracks', JSON.stringify(processedTracks));
      alert(`Removed ${removedCount} duplicate tracks`);
    } else {
      alert('No duplicate tracks found');
    }
  };

  const handleSpotifyFetch = async (trackId: string) => {
    setFetchState({
      loading: true,
      error: null,
    });

    try {
      // Get track details from Spotify
      const trackDetails = await spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
      if (!trackDetails) {
        throw new Error('Failed to fetch track details from Spotify');
      }

      // Debug log
      console.log('Fetched track details:', trackDetails);

      setFormData({
        id: trackDetails.id,
        trackTitle: trackDetails.trackTitle,
        artist: trackDetails.artist,
        recordLabel: validateRecordLabel(trackDetails.recordLabel),
        spotifyUrl: trackDetails.spotifyUrl,
        albumCover: trackDetails.albumCover || '',
        album: trackDetails.album,
        releaseDate: trackDetails.releaseDate,
        previewUrl: trackDetails.previewUrl || null,
        beatportUrl: trackDetails.beatportUrl || '',
        soundcloudUrl: trackDetails.soundcloudUrl || ''
      });

      setFetchState({
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error processing Spotify URL:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to process Spotify URL',
      });
    }
  };

  const handleSpotifyUrlChange = async (value: string) => {
    handleInputChange('spotifyUrl', value);

    // If it's a valid URL, fetch metadata
    if (value && isValidSpotifyUrl(value)) {
      try {
        setFetchState({ loading: true, error: null });
        const trackDetails = await spotifyService.getTrackDetailsByUrl(value);
        
        if (trackDetails) {
          setFormData({
            id: trackDetails.id,
            trackTitle: trackDetails.trackTitle,
            artist: trackDetails.artist,
            recordLabel: validateRecordLabel(trackDetails.recordLabel),
            spotifyUrl: trackDetails.spotifyUrl,
            albumCover: trackDetails.albumCover || '',
            album: trackDetails.album,
            releaseDate: trackDetails.releaseDate,
            previewUrl: trackDetails.previewUrl || null,
            beatportUrl: trackDetails.beatportUrl || '',
            soundcloudUrl: trackDetails.soundcloudUrl || ''
          });
          setFetchState({ loading: false, error: null });
        } else {
          throw new Error('Failed to fetch track details');
        }
      } catch (error) {
        setFetchState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch track metadata'
        });
      }
    }
  };

  const handleOpen = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setFetchState(initialFetchState);
    setOpen(true);
  };

  const handleClose = () => {
    console.log('Closing dialog...');
    setOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
    setFetchState(initialFetchState);
  };

  const handleEdit = (track: Track) => {
    setFormData({
      id: track.id,
      trackTitle: track.trackTitle,
      artist: track.artist,
      recordLabel: validateRecordLabel(track.recordLabel),
      spotifyUrl: track.spotifyUrl,
      albumCover: track.albumCover || '',
      album: track.album,
      releaseDate: track.releaseDate,
      previewUrl: track.previewUrl || null,
      beatportUrl: track.beatportUrl || '',
      soundcloudUrl: track.soundcloudUrl || ''
    });
    setEditingId(track.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    try {
      const updatedTracks = tracks.filter(track => track.id !== id);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
    } catch (err) {
      console.error('Error deleting track:', err);
    }
  };

  const handleInputChange = (field: keyof TrackFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear any previous errors
    if (fetchState.error) {
      setFetchState({ loading: false, error: null });
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as RecordLabel;
    setFormData(prev => ({
      ...prev,
      recordLabel: value
    }));
  };

  const handleSubmit = async (event: React.MouseEvent) => {
    event.preventDefault();
    await handleTrackSubmit(formData);
  };

  const handleSpotifyImport = async () => {
    if (!formData.spotifyUrl) {
      setFetchState({
        loading: false,
        error: 'Please enter a Spotify URL'
      });
      return;
    }

    try {
      setFetchState({ loading: true, error: null });

      const trackDetails = await spotifyService.getTrackDetailsByUrl(formData.spotifyUrl);
      if (!trackDetails) {
        throw new Error('Failed to fetch track details');
      }

      // Efficient duplicate check using Map
      const normalizedUrl = normalizeSpotifyUrl(formData.spotifyUrl);
      const trackMap = new Map(tracks.map(t => [normalizeSpotifyUrl(t.spotifyUrl), t]));
      const existingTrack = trackMap.get(normalizedUrl);
      
      if (existingTrack && existingTrack.id !== editingId) {
        setFetchState({
          loading: false,
          error: 'This track already exists in the database'
        });
        return;
      }

      const newTrack: Track = {
        id: trackDetails.id,
        trackTitle: trackDetails.trackTitle,
        artist: trackDetails.artist,
        spotifyUrl: trackDetails.spotifyUrl,
        recordLabel: trackDetails.recordLabel,
        albumCover: trackDetails.albumCover,
        album: trackDetails.album,
        releaseDate: trackDetails.releaseDate,
        previewUrl: trackDetails.previewUrl,
        beatportUrl: '',
        soundcloudUrl: ''
      };

      // Update tracks efficiently
      const updatedTracks = editingId
        ? tracks.map(track => track.id === editingId ? newTrack : track)
        : [...tracks, newTrack];
        
      // Sort in the same operation
      updatedTracks.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      setTracks(updatedTracks);
      setFetchState({ loading: false, error: null });
      
      console.log('Closing dialog after import...');
      setOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error importing from Spotify:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to import from Spotify'
      });
    }
  };

  const handleTrackSubmit = async (formData: TrackFormData) => {
    try {
      setFetchState({ loading: true, error: null });

      // Convert form data to Track object
      const newTrack: Track = {
        id: editingId || crypto.randomUUID(),
        trackTitle: formData.trackTitle,
        artist: formData.artist,
        albumCover: formData.albumCover || '',
        album: formData.album,
        recordLabel: formData.recordLabel,
        spotifyUrl: formData.spotifyUrl || '',
        releaseDate: formData.releaseDate || new Date().toISOString(),
        previewUrl: formData.previewUrl || null,
        beatportUrl: formData.beatportUrl,
        soundcloudUrl: formData.soundcloudUrl
      };

      // Save to local storage
      const existingTracks = JSON.parse(localStorage.getItem('tracks') || '[]') as Track[];
      const updatedTracks = editingId 
        ? existingTracks.map(track => track.id === editingId ? newTrack : track) 
        : [...existingTracks, newTrack];
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));

      // Update state
      setTracks(updatedTracks);

      // Clear form and show success message
      setFormData(initialFormData);
      setFetchState({ loading: false, error: null });
      handleClose();
    } catch (err) {
      console.error('Error submitting track:', err);
      setFetchState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to add track'
      });
    }
  };

  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    setImportLabel('');
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportLabel('');
  };

  const handleImportTracks = async () => {
    if (!importLabel) {
      setFetchState({
        loading: false,
        error: 'Please enter a label name'
      });
      return;
    }

    // Validate label name format
    const validLabels = ['build it deep', 'build it records', 'build it tech'];
    if (!validLabels.includes(importLabel.toLowerCase())) {
      setFetchState({
        loading: false,
        error: 'Please enter a valid label name: "Build It Deep", "Build It Records", or "Build It Tech"'
      });
      return;
    }

    setImporting(true);
    setImportProgress(null);
    setFetchState({ loading: true, error: null });

    try {
      const importedTracks = await spotifyService.importLabelTracks(
        importLabel as RecordLabel,
        50,
        (imported: number, total: number) => {
          setImportProgress({ imported, total });
        }
      );

      // Update tracks with new ones and sort
      setTracks(prevTracks => {
        const trackMap = new Map(prevTracks.map(track => [track.id, track]));
        
        // Add new tracks, overwriting any existing ones with the same ID
        importedTracks.forEach(track => {
          track.recordLabel = importLabel as RecordLabel; // Ensure label is set
          trackMap.set(track.id, track);
        });

        // Convert back to array and sort by release date
        const updatedTracks = Array.from(trackMap.values()).sort((a, b) => {
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        });

        // Save to localStorage
        localStorage.setItem('tracks', JSON.stringify(updatedTracks));
        
        return updatedTracks;
      });

      // Show success message
      alert(`Successfully imported ${importedTracks.length} tracks for ${importLabel}`);

    } catch (error) {
      console.error('Error importing tracks:', error);
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred while importing tracks'
      });
    } finally {
      setImporting(false);
      setImportDialogOpen(false);
      setImportLabel('');
      setImportProgress(null);
    }
  };

  const handleLabelChange = (event: SelectChangeEvent<RecordLabel | 'All'>) => {
    setSelectedLabel(event.target.value as RecordLabel | 'All');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Filter tracks based on search query and selected label
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      track.trackTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabel = selectedLabel === 'All' || 
      (track.recordLabel && track.recordLabel.trim() === selectedLabel.trim());
    
    if (selectedLabel !== 'All' && matchesLabel) {
      console.log(`Track ${track.trackTitle} matches label ${selectedLabel}`);
    }
    
    return matchesSearch && matchesLabel;
  });

  // Calculate pagination
  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack);
  const totalPages = Math.ceil(filteredTracks.length / tracksPerPage);

  useEffect(() => {
    if (selectedLabel !== 'All') {
      console.log(`Filtered ${filteredTracks.length} tracks for label: ${selectedLabel}`);
      console.log('Sample tracks:', filteredTracks.slice(0, 3));
    }
  }, [selectedLabel, filteredTracks]);

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        backgroundColor: '#282828',
        p: 3,
        borderRadius: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ color: '#FFFFFF' }}>
          Track Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            onClick={handleImportDialogOpen}
            sx={{ mr: 2 }}
          >
            Import by Label
          </Button>
          <Button 
            variant="contained" 
            onClick={handleOpen}
            sx={{
              backgroundColor: '#02FF95',
              color: '#121212',
              '&:hover': {
                backgroundColor: '#00CC76',
              }
            }}
          >
            Add New Track
          </Button>
        </Box>
      </Box>

      {fetchState.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {fetchState.error}
        </Typography>
      )}

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Search tracks"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, artist, or Spotify URL"
          sx={{ flex: 1 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Label</InputLabel>
          <Select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value as RecordLabel | 'All')}
            label="Filter by Label"
          >
            <MenuItem value="All">All Labels</MenuItem>
            {Object.values(RECORD_LABELS).map((label) => (
              <MenuItem key={label} value={label}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setFormData(initialFormData);
            setOpen(true);
          }}
        >
          Add Track
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={cleanDuplicates}
          title="Remove duplicate tracks based on Spotify URL"
        >
          Clean Duplicates
        </Button>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mb: 2
      }}>
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Page {currentPage} of {totalPages} • {filteredTracks.length} Releases
          </Typography>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        maxHeight: '600px',
        overflowY: 'auto',
        p: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        bgcolor: '#f5f5f5'
      }}>
        {currentTracks.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            {searchQuery || selectedLabel !== 'All' 
              ? 'No tracks found matching your search criteria'
              : 'No tracks added yet'}
          </Typography>
        ) : (
          currentTracks.map((track) => (
            <Box component="li" key={track.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, backgroundColor: '#333', p: 2, borderRadius: 1 }}>
              <Box component="img" src={track.albumCover} alt={track.trackTitle} sx={{ width: 50, height: 50, mr: 2, borderRadius: 1 }} />
              <Typography variant="body1" sx={{ color: '#FFFFFF', flex: 1 }}>{track.trackTitle}</Typography>
              <Typography variant="body2" sx={{ color: '#AAAAAA', flex: 1 }}>{track.artist}</Typography>
              <Typography variant="body2" sx={{ color: '#AAAAAA', flex: 1 }}>{track.recordLabel}</Typography>
              <Typography variant="body2" sx={{ color: '#AAAAAA', flex: 1 }}>{track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : 'Unknown'}</Typography>
            </Box>
          ))
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mt: 2
      }}>
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Page {currentPage} of {totalPages} • {filteredTracks.length} Releases
          </Typography>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 18, 18, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          {editingId ? 'Edit Track' : 'Add New Track'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Spotify URL"
              value={formData.spotifyUrl}
              onChange={(e) => handleSpotifyUrlChange(e.target.value)}
              error={!!fetchState.error}
              helperText={fetchState.error}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
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
              }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="record-label-select-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Record Label
              </InputLabel>
              <Select
                labelId="record-label-select-label"
                value={formData.recordLabel}
                onChange={handleSelectChange}
                label="Record Label"
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {Object.values(RECORD_LABELS).map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.albumCover && (
              <Box 
                sx={{ 
                  width: '100%',
                  position: 'relative',
                  paddingTop: '100%',
                  mb: 2,
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box
                  component="img"
                  src={formData.albumCover}
                  alt={formData.trackTitle}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            )}
            <TextField
              fullWidth
              label="Track Title"
              value={formData.trackTitle}
              onChange={(e) => handleInputChange('trackTitle', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
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
              }}
            />
            <TextField
              fullWidth
              label="Artist"
              value={formData.artist}
              onChange={(e) => handleInputChange('artist', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
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
              }}
            />
            <TextField
              fullWidth
              label="Beatport URL (Optional)"
              value={formData.beatportUrl}
              onChange={(e) => handleInputChange('beatportUrl', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
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
              }}
            />
            <TextField
              fullWidth
              label="SoundCloud URL (Optional)"
              value={formData.soundcloudUrl}
              onChange={(e) => handleInputChange('soundcloudUrl', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
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
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: '#fff',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={fetchState.loading}
            sx={{
              bgcolor: '#1DB954',
              color: '#fff',
              '&:hover': {
                bgcolor: '#1ed760'
              }
            }}
          >
            {fetchState.loading ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              editingId ? 'Save Changes' : 'Add Track'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)}>
        <DialogTitle>Import Tracks by Label</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <TextField
              fullWidth
              label="Label Name"
              value={importLabel}
              onChange={(e) => setImportLabel(e.target.value)}
              disabled={importing}
              helperText="Enter exact label name: 'Build It Deep', 'Build It Records', or 'Build It Tech'"
              error={Boolean(fetchState.error)}
            />
            {fetchState.error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {fetchState.error}
              </Typography>
            )}
            {importing && importProgress && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mb: 1 }} />
                <Typography variant="body2">
                  Importing tracks: {importProgress.imported} of {importProgress.total}
                  {importProgress.imported < importProgress.total && '... (waiting 3s between batches)'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImportTracks}
            variant="contained"
            color="primary"
            disabled={importing || !importLabel}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
