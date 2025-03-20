import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Skeleton,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { debounce } from 'lodash';
import { useLocation, Location } from 'react-router-dom';
import { databaseService } from '../services/DatabaseService';
import { DatabaseError } from '../utils/errors';
import ArtistCard from '../components/ArtistCard';
import ArtistModal from '../components/modals/ArtistModal';
import ErrorBoundary from '../components/ErrorBoundary.jsx'; 
import { Artist } from '../types/artist';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { labelColors } from '../theme/theme';

// Removed ITEMS_PER_PAGE constant as we're showing all artists

interface SearchState {
  total: number;
}

interface ArtistsPageProps {
  label: keyof typeof RECORD_LABELS;
  location?: Location;
}

interface ArtistsPageState {
  artists: Artist[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedArtist: Artist | null;
  searchState: SearchState;
  modalOpen: boolean;
}

function ArtistsPage(props: ArtistsPageProps) {
  const location = useLocation();
  const theme = useTheme();
  
  // State hooks
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchState, setSearchState] = useState({ total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  
  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      handleSearch(term);
    }, 500),
    []
  );
  
  // Effects
  useEffect(() => {
    fetchArtists();
  }, [props.label]);

  // Handler functions
  const handleInputChange = (e: any) => {
    const target = e.target as HTMLInputElement;
    const term = target.value;
    setSearchTerm(term);
    
    if (term) {
      debouncedSearch(term);
    } else {
      fetchArtists();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchArtists();
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSearch = async (term: string) => {
    if (!term) return;
    
    setLoading(true);
    try {
      // Use the correct method from DatabaseService
      const url = `api/artists/search?q=${encodeURIComponent(term)}&label=${getLabelId()}`;
      const response = await databaseService.fetchApi<{ data: Artist[] }>(url);
      const artistResults = Array.isArray(response.data) ? response.data : [];
      setArtists(artistResults);
      setSearchState({
        total: artistResults.length || 0
      });
      setLoading(false);
    } catch (err) {
      setError('Error searching artists');
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const labelId = getLabelId();
      console.log('Fetching artists for label ID:', labelId);
      
      const results = await databaseService.getArtistsForLabel(labelId);
      console.log('Artists fetched successfully:', results.length);
      
      setArtists(results || []);
      setSearchState({
        total: results.length
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching artists:', err);
      
      let errorMessage = 'Failed to fetch artists. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('Detailed error:', errorMessage);
      
      setLoading(false);
      setError(errorMessage);
      setArtists([]); // Ensure artists is set to an empty array on error
    }
  };

  const getLabelId = () => {
    const { label } = props;
    // Map route label names to numeric label IDs that match our Supabase database
    const labelMap: Record<string, string> = {
      'records': '1',  // BUILD IT RECORDS
      'tech': '2',     // BUILD IT TECH 
      'deep': '3'      // BUILD IT DEEP
    };
    
    return labelMap[label] || '2'; // Default to BUILD IT TECH
  };

  const getTitle = () => {
    const { label } = props;
    const titleMap: Record<string, string> = {
      'records': 'Build It Records Artists',
      'tech': 'Build It Tech Artists',
      'deep': 'Build It Deep Artists'
    };
    
    return titleMap[label] || 'Build It Tech Artists';
  };

  const getFilteredArtists = () => {
    if (!searchTerm.trim()) {
      return artists;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return artists.filter(artist => 
      artist.name?.toLowerCase().includes(lowerSearchTerm)
    );
  };

  const renderArtistCard = (artist: Artist) => {
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
        <ErrorBoundary>
          <ArtistCard 
            artist={artist} 
            onClick={() => handleArtistClick(artist)} 
          />
        </ErrorBoundary>
      </Grid>
    );
  };

  // Render the component
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            color: labelColors[props.label] || '#02FF95'
          }}
        >
          {getTitle()}
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by artist name..."
          value={searchTerm}
          onChange={handleInputChange}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              bgcolor: 'background.paper',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)'
              },
              '&:hover fieldset': {
                borderColor: `${alpha(labelColors[props.label] || '#02FF95', 0.5)}`
              },
              '&.Mui-focused fieldset': {
                borderColor: labelColors[props.label] || '#02FF95'
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: labelColors[props.label] || '#02FF95'
            },
            '& .MuiInputBase-input': {
              color: '#ffffff'
            }
          }}
        />
        
        {loading && artists.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Updating artists...
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
          <Button 
            size="small" 
            startIcon={<RefreshIcon />} 
            onClick={handleClearSearch}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleClearSearch}>
              <RefreshIcon sx={{ mr: 1 }} />
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {loading && artists.length === 0 ? (
        <Grid container spacing={3}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
              <Skeleton variant="text" height={20} width="60%" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {getFilteredArtists().map(renderArtistCard)}
        </Grid>
      )}
      
      {selectedArtist && (
        <ArtistModal
          open={modalOpen}
          onClose={handleCloseModal}
          artist={selectedArtist}
        />
      )}
    </Container>
  );
}

export default ArtistsPage;
