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
import ErrorBoundary from '../components/ErrorBoundary';
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

const ArtistSection: React.FC<{ artist: Artist }> = ({ artist }) => {
  if (!artist || typeof artist !== 'object') {
    console.error('Invalid artist passed to ArtistSection:', artist);
    return null;
  }

  return (
    <ErrorBoundary>
      <ArtistCard artist={artist} />
    </ErrorBoundary>
  );
};

const ArtistsPage: React.FC<ArtistsPageProps> = ({ label }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({
    total: 0,
    page: 1,
  });

  const labelId = RECORD_LABELS[label]?.id;
  const labelDisplayName = RECORD_LABELS[label]?.displayName || 'Artists';

  const fetchArtists = async () => {
    if (!labelId) {
      setError('Invalid label');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching artists for label:', labelId);
      const fetchedArtists = await databaseService.getArtistsForLabel(labelId);
      
      // Filter out invalid artists
      const validArtists = fetchedArtists.filter((artist): artist is Artist => {
        if (!artist || typeof artist !== 'object') {
          console.error('Invalid artist object:', artist);
          return false;
        }
        return true;
      });

      console.log('Found valid artists:', validArtists.length);
      setArtists(validArtists);
      setSearchState(prev => ({ ...prev, total: validArtists.length }));
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError(err instanceof DatabaseError ? err.message : 'Failed to fetch artists');
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          setLoading(true);
          setError(null);
          const filteredArtists = artists.filter(artist =>
            artist.name.toLowerCase().includes(query.toLowerCase())
          );
          setSearchState(prev => ({
            ...prev,
            total: filteredArtists.length,
            page: 1,
          }));
        } catch (err) {
          console.error('Error searching artists:', err);
          setError(err instanceof DatabaseError ? err.message : 'Failed to search artists');
        } finally {
          setLoading(false);
        }
      }, 300),
    [artists]
  );

  useEffect(() => {
    fetchArtists();
  }, [labelId]);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setSearchState(prev => ({ ...prev, total: artists.length, page: 1 }));
    }
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  if (!labelId) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid label
        </Typography>
      </Box>
    );
  }

  const filteredArtists = searchQuery
    ? artists.filter(artist =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artists;

  const startIndex = (searchState.page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedArtists = filteredArtists.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredArtists.length / ITEMS_PER_PAGE);

  return (
    <Container maxWidth="xl" sx={{ mt: 8, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {labelDisplayName}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchArtists}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : displayedArtists.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {displayedArtists.map((artist) => (
              <Grid item xs={12} sm={6} md={3} key={artist.id}>
                <ArtistSection artist={artist} />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={searchState.page}
                onChange={(_, page) => setSearchState(prev => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary">
            No artists found
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ArtistsPage;
