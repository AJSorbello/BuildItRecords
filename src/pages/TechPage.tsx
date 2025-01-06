import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, Link as MuiLink, IconButton, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { OpenInNew } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Artist } from '../types/artist';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '10px',
  '&:hover': {
    color: '#1DB954',
  },
});

const TechPage = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const techArtists = await databaseService.getArtistsForLabel(RECORD_LABELS['buildit-tech']);
        if (techArtists.length === 0) {
          setError('No artists found');
          return;
        }
        setArtists(techArtists);
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
      <PageLayout label="tech">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout label="tech">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography color="error">{error}</Typography>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout label="tech">
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={4}>
          {artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} key={artist.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: colors.card,
                  borderRadius: 2
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ height: 200, objectFit: 'cover' }}
                  image={artist.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={artist.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2" sx={{ color: colors.text }}>
                    {artist.name}
                  </Typography>
                  {artist.genres && artist.genres.length > 0 && (
                    <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
                      {artist.genres.join(', ')}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {artist.spotifyUrl && (
                      <IconButton
                        component="a"
                        href={artist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: colors.text }}
                      >
                        <OpenInNew />
                      </IconButton>
                    )}
                    <IconLink to={`/artists/${artist.id}`}>View Details</IconLink>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default TechPage;
