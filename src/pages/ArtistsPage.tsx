import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Skeleton
} from '@mui/material';
import { debounce } from 'lodash';
import { useLocation } from 'react-router-dom';
import { databaseService } from '../services/DatabaseService';
import { DatabaseError } from '../utils/errors';
import ArtistCard from '../components/ArtistCard';
import ArtistModal from '../components/modals/ArtistModal';
import { ErrorBoundary } from '../components/ErrorBoundary'; 
import { Artist } from '../types/artist';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';

const ITEMS_PER_PAGE = 12;

interface SearchState {
  total: number;
  page: number;
}

interface ArtistsPageProps {
  label: keyof typeof RECORD_LABELS;
}

const ArtistSection: React.FC<{ artist: Artist; onArtistClick: (artist: Artist) => void }> = ({ artist, onArtistClick }) => {
  if (!artist || typeof artist !== 'object') {
    console.error('Invalid artist passed to ArtistSection:', artist);
    return null;
  }

  return (
    <ErrorBoundary>
      <ArtistCard artist={artist} onClick={() => onArtistClick(artist)} />
    </ErrorBoundary>
  );
};

const ArtistsPage: React.FC<ArtistsPageProps> = ({ label }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    total: 0,
    page: 1,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const labelId = useMemo(() => {
    // Ensure label has the proper prefix
    const labelStr = String(label);
    if (!labelStr.startsWith('buildit-')) {
      return `buildit-${labelStr}`;
    }
    return labelStr;
  }, [label]);

  const labelDisplayName = RECORD_LABELS[label]?.displayName || 'Artists';

  const handleArtistClick = (artist: Artist) => {
    if (artist) {
      setSelectedArtist(artist);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedArtist(null);
  };

  const fetchArtists = async () => {
    if (!labelId) {
      setError('Invalid label');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching artists for label:', labelId);
      const artists = await databaseService.getArtistsForLabel(labelId);
      
      if (Array.isArray(artists)) {
        setArtists(artists);
        setSearchState(prev => ({ ...prev, total: artists.length }));
      } else {
        console.error('Invalid artists data received:', artists);
        setArtists([]);
        setError('Invalid data received from server');
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setArtists([]); // Ensure artists is always an array
      if (err instanceof DatabaseError) {
        setError(err.message);
      } else {
        setError('Failed to load artists');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtered artists based on search term
  const filteredArtists = useMemo(() => {
    if (!artists || !Array.isArray(artists)) return [];
    
    if (!searchTerm) return artists;
    
    const searchTermLower = searchTerm.toLowerCase();
    return artists.filter(artist => 
      artist?.name?.toLowerCase().includes(searchTermLower)
    );
  }, [artists, searchTerm]);

  // Calculate pagination
  const paginatedArtists = useMemo(() => {
    if (!filteredArtists || !Array.isArray(filteredArtists)) return [];
    
    const startIndex = (searchState.page - 1) * ITEMS_PER_PAGE;
    return filteredArtists.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArtists, searchState.page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setSearchState(prev => ({ ...prev, page: value }));
  };

  const handleRefresh = () => {
    fetchArtists();
  };

  useEffect(() => {
    fetchArtists();
  }, [labelId]);

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {labelDisplayName}
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        <Grid container spacing={3}>
          {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="contained"
          color="primary"
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {labelDisplayName}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Search input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search artists..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
      />

      {/* Artist grid */}
      <Grid container spacing={3}>
        {paginatedArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={artist?.id || 'unknown'}>
            <ErrorBoundary>
              <ArtistSection artist={artist} onArtistClick={handleArtistClick} />
            </ErrorBoundary>
          </Grid>
        ))}
      </Grid>

      {/* Show message if no artists found */}
      {filteredArtists.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No artists found matching your search' : 'No artists found'}
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {filteredArtists.length > ITEMS_PER_PAGE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredArtists.length / ITEMS_PER_PAGE)}
            page={searchState.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Artist modal */}
      {selectedArtist && (
        <ArtistModal
          open={modalOpen}
          onClose={handleCloseModal}
          artist={selectedArtist}
        />
      )}
    </Container>
  );
};

export default ArtistsPage;
