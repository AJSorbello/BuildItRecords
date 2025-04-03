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
import { useInView } from 'react-intersection-observer';

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
  displayedArtists: Artist[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedArtist: Artist | null;
  searchState: SearchState;
  modalOpen: boolean;
  initialLoadComplete: boolean;
  visibleArtists: number;
  currentPage: number;
  hasMore: boolean;
}

function ArtistsPage(props: ArtistsPageProps) {
  const location = useLocation();
  const theme = useTheme();
  
  // State hooks
  const [artists, setArtists] = useState<Artist[]>([]);
  const [displayedArtists, setDisplayedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchState, setSearchState] = useState({ total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [visibleArtists, setVisibleArtists] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Use intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      handleSearch(term);
    }, 300),
    []
  );
  
  // Effects
  useEffect(() => {
    fetchArtists();
  }, [props.label]);
  
  // Load more artists when scrolling to the bottom
  useEffect(() => {
    if (inView && !loading && initialLoadComplete) {
      if (visibleArtists < displayedArtists.length) {
        // First show more from already loaded artists
        setVisibleArtists(prev => Math.min(prev + 10, displayedArtists.length));
      } else if (hasMore) {
        // Then load next page if needed
        loadMoreArtists();
      }
    }
  }, [inView, loading, initialLoadComplete, displayedArtists.length, visibleArtists, hasMore]);

  // Filter artists when search term changes
  useEffect(() => {
    if (initialLoadComplete) {
      filterArtists();
    }
  }, [searchTerm, artists, initialLoadComplete]);

  // Filter artists based on search term
  const filterArtists = () => {
    if (!searchTerm.trim()) {
      setDisplayedArtists(artists);
      return;
    }
    
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = artists.filter(artist => 
      artist.name.toLowerCase().includes(lowerTerm)
    );
    
    setDisplayedArtists(filtered);
    setVisibleArtists(Math.min(10, filtered.length));
  };

  // Handler functions
  const handleInputChange = (e: any) => {
    const target = e.target as HTMLInputElement;
    const term = target.value;
    setSearchTerm(term);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSearch = async (term: string) => {
    if (!term) {
      setDisplayedArtists(artists);
      return;
    }
    
    const lowerSearchTerm = term.toLowerCase();
    const filteredArtists = artists.filter(artist => 
      artist.name?.toLowerCase().includes(lowerSearchTerm)
    );
    
    setDisplayedArtists(filteredArtists);
    setVisibleArtists(Math.min(10, filteredArtists.length));
    
    setSearchState({
      total: filteredArtists.length || 0
    });
  };

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const labelId = getLabelId();
      console.log('Fetching artists for label ID:', labelId);
      
      const results = await databaseService.getArtistsForLabel(labelId);
      console.log('Artists fetched successfully:', results.length);
      
      const sortedArtists = [...results].sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      
      setArtists(sortedArtists || []);
      setDisplayedArtists(sortedArtists || []);
      setSearchState({
        total: results.length
      });
      
      setLoading(false);
      setInitialLoadComplete(true);
      setVisibleArtists(Math.min(10, sortedArtists.length));
      setHasMore(false); // Since we load all artists at once
    } catch (error) {
      if (error instanceof DatabaseError) {
        setError(error.message);
      } else {
        setError('Failed to load artists. Please try again later.');
      }
      console.error('[ArtistsPage] Error loading artists:', error);
      setLoading(false);
    }
  };

  const loadMoreArtists = () => {
    if (loading || !hasMore) return;
    
    setVisibleArtists(prev => Math.min(prev + 10, displayedArtists.length));
    
    // No need to fetch more since we load all at once
    // But set hasMore to false if we've shown all artists
    if (visibleArtists >= displayedArtists.length) {
      setHasMore(false);
    }
  };

  const getLabelId = () => {
    const { label } = props;
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
          {displayedArtists.slice(0, visibleArtists).map(renderArtistCard)}
        </Grid>
      )}
      
      {/* Add load more indicator/trigger */}
      <Box ref={loadMoreRef} sx={{ textAlign: 'center', p: 3, mt: 2 }}>
        {loading && initialLoadComplete ? (
          <CircularProgress size={30} thickness={3} />
        ) : displayedArtists.length > visibleArtists ? (
          <Button 
            variant="outlined" 
            onClick={() => setVisibleArtists(prev => Math.min(prev + 10, displayedArtists.length))}
          >
            Load More Artists
          </Button>
        ) : displayedArtists.length > 0 ? (
          <Typography variant="body2" color="textSecondary">
            All artists loaded
          </Typography>
        ) : searchTerm ? (
          <Typography variant="body2" color="textSecondary">
            No artists match your search
          </Typography>
        ) : null}
      </Box>
      
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
