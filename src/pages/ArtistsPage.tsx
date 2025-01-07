import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import ArtistCard from '../components/artists/ArtistCard';
import { Artist } from '../types/Artist';
import { databaseService } from '../services/DatabaseService';
import { RECORD_LABELS, LABEL_DISPLAY_NAMES } from '../constants/labels';

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Get the current label based on the URL
  const getCurrentLabel = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/deep/artists')) return 'buildit-deep';
    if (path.includes('/tech/artists')) return 'buildit-tech';
    if (path.includes('/records/artists')) return 'buildit-records';
    return null; // For /artists - show all
  };

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentLabel = getCurrentLabel();
        let labels = currentLabel ? [currentLabel] : ['buildit-records', 'buildit-tech', 'buildit-deep'];
        
        const artistsPromises = labels.map(labelId => 
          databaseService.getArtistsByLabel(RECORD_LABELS[labelId])
        );
        
        const artistsResults = await Promise.all(artistsPromises);
        
        // Combine and deduplicate artists by ID, then sort alphabetically
        const uniqueArtists = Array.from(
          new Map(
            artistsResults
              .flat()
              .map(artist => [artist.id, artist])
          ).values()
        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setArtists(uniqueArtists);
      } catch (error) {
        console.error('Error fetching artists:', error);
        setError('Failed to load artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [location.pathname]); // Refetch when route changes

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const currentLabel = getCurrentLabel();
  const title = currentLabel ? LABEL_DISPLAY_NAMES[currentLabel] : 'All Artists';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={3}>
        {artists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} key={artist.id}>
            <ArtistCard artist={artist} />
          </Grid>
        ))}
        {artists.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No artists found
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ArtistsPage;
