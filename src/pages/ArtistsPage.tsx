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
import { databaseService, DatabaseApiError } from '../services/DatabaseService';
import ArtistCard from '../components/ArtistCard';
import { Artist } from '../types/artist';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const ITEMS_PER_PAGE = 12;

interface SearchState {
  total: number;
  page: number;
}

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({
    total: 0,
    page: 1,
  });
  const location = useLocation();

  // Determine the label based on the current route
  const getLabel = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/records/artists')) return 'Build It Records';
    if (path.includes('/tech/artists')) return 'Build It Tech';
    if (path.includes('/deep/artists')) return 'Build It Deep';
    return undefined;
  }, [location.pathname]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          setLoading(true);
          const response = await databaseService.getArtists(
            query.trim(),
            searchState.page,
            ITEMS_PER_PAGE
          );
          setArtists(response.artists || []);
          setSearchState({ ...searchState, total: response.total });
          setError(null);
        } catch (err) {
          if (err instanceof DatabaseApiError) {
            setError(err.message);
          } else {
            setError('Failed to load artists');
          }
          setArtists([]);
        } finally {
          setLoading(false);
        }
      }, 500),
    [searchState.page]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setSearchState({ ...searchState, page: 1 }); // Reset to first page on new search
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setSearchState({ ...searchState, page });
  };

  const handleRetry = () => {
    debouncedSearch(searchQuery);
  };

  const totalPages = Math.ceil(searchState.total / ITEMS_PER_PAGE);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Artists {getLabel ? `- ${getLabel}` : ''}
        </Typography>

        <TextField
          fullWidth
          label="Search Artists"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={loading}
          sx={{ mb: 4 }}
        />

        {error ? (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Skeleton variant="rectangular" height={200} />
                <Skeleton variant="text" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="60%" />
              </Grid>
            ))}
          </Grid>
        ) : artists.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {artists.map((artist) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
                  <ArtistCard artist={artist} />
                </Grid>
              ))}
            </Grid>
            
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={searchState.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              {searchQuery
                ? 'No artists found matching your search'
                : 'No artists found'}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ArtistsPage;
