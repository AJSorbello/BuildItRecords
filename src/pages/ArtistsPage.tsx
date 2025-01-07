import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import { debounce } from 'lodash';
import { databaseService } from '../services/DatabaseService';
import ArtistCard from '../components/ArtistCard';
import { Artist } from '../types/artist';

const ITEMS_PER_PAGE = 12;

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const searchArtists = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Searching artists with query:', query);
      const fetchedArtists = await databaseService.getArtists(
        query.trim() ? { search: query.trim() } : {}
      );
      console.log('Fetched artists:', fetchedArtists);
      setArtists(fetchedArtists || []);
    } catch (err) {
      console.error('Error searching artists:', err);
      setError('Failed to load artists. Please try again later.');
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce the search to avoid too many API calls
  const debouncedSearch = debounce(searchArtists, 300);

  useEffect(() => {
    // Initial load of all artists
    searchArtists('');
    
    // Cleanup debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleArtistClick = (artist: Artist) => {
    if (artist.external_urls?.spotify) {
      window.open(artist.external_urls.spotify, '_blank');
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(artists.length / ITEMS_PER_PAGE);
  const currentArtists = artists.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Artists
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Search artists"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ maxWidth: 500 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {currentArtists.map((artist) => (
                <Grid item key={artist.id} xs={12} sm={6} md={4} lg={3}>
                  <ArtistCard
                    artist={artist}
                    onClick={() => handleArtistClick(artist)}
                  />
                </Grid>
              ))}
            </Grid>

            {artists.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No artists found
                </Typography>
              </Box>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default ArtistsPage;
