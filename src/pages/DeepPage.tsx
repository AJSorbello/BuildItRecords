import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Link as MuiLink, IconButton, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { OpenInNew, Instagram, Facebook, Twitter } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Artist } from '../types/artist';
import TrackList from '../components/TrackList';
import PageLayout from '../components/PageLayout';

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '10px',
  '&:hover': {
    color: '#1DB954',
  },
});

const DeepPage = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch artists
        const deepArtists = await databaseService.getArtistsForLabel(RECORD_LABELS['buildit-deep']);
        if (deepArtists.length === 0) {
          setError('No artists found');
          return;
        }
        setArtists(deepArtists);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <PageLayout label="deep">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout label="deep">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography color="error">{error}</Typography>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout label="deep">
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Build It Deep Artists
        </Typography>
        
        <Grid container spacing={4}>
          {artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} key={artist.id}>
              <Card>
                <Box sx={{ position: 'relative' }}>
                  {artist.images.map((image, index) => (
                    <CardMedia
                      key={index}
                      component="img"
                      height="200"
                      image={image.url || 'https://via.placeholder.com/200'}
                      alt={artist.name}
                    />
                  ))}
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {artist.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      height: '3em',
                      overflow: 'hidden',
                      mb: 2
                    }}>
                      {artist.bio || `Artist on ${RECORD_LABELS['buildit-deep'].displayName}`}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        {artist.spotifyUrl && (
                          <MuiLink href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">
                            <IconButton size="small">
                              <OpenInNew />
                            </IconButton>
                          </MuiLink>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default DeepPage;
