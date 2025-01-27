import React, { useState } from 'react';
import {
  Box,
  TextField,
  Container,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import SpotifyTrackList from './SpotifyTrackList';

const SpotifySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input to avoid too many API calls
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set new timeout
    window.searchTimeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Music Search
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
              }
            }}
          />
        </Box>

        {debouncedQuery && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Results for "{debouncedQuery}"
            </Typography>
            <SpotifyTrackList searchQuery={debouncedQuery} />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SpotifySearch;
