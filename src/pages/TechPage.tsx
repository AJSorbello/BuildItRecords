import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, IconButton, CircularProgress, Alert } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Artist, Release } from '../types';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import TechSidebar from '../components/TechSidebar';

const TechPage = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [featuredRelease, setFeaturedRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [techArtists, techReleases] = await Promise.all([
          databaseService.getArtistsForLabel('buildit-tech'),
          databaseService.getReleasesForLabel('buildit-tech')
        ]);

        if (techArtists.length === 0) {
          setError('No artists found');
          return;
        }

        setArtists(techArtists);
        // Set the most recent release as featured
        if (techReleases.length > 0) {
          setFeaturedRelease(techReleases[0]);
        }
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
          <Alert severity="error">{error}</Alert>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout label="tech">
      <Box sx={{ display: 'flex' }}>
        <TechSidebar variant="permanent" />
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {featuredRelease && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: colors.text }}>
                Featured Release
              </Typography>
              <Card 
                sx={{ 
                  display: 'flex',
                  backgroundColor: colors.card,
                  borderRadius: 2
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: 300, height: 300 }}
                  image={featuredRelease.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={featuredRelease.title}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h5" component="h2" sx={{ color: colors.text }}>
                    {featuredRelease.title}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: colors.textSecondary }}>
                    {featuredRelease.primaryArtist?.name}
                  </Typography>
                  {featuredRelease.spotifyUrl && (
                    <IconButton
                      component="a"
                      href={featuredRelease.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: colors.text, mt: 2, width: 'fit-content' }}
                    >
                      <OpenInNew />
                    </IconButton>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          <Typography variant="h4" component="h2" gutterBottom sx={{ color: colors.text }}>
            Artists
          </Typography>
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default TechPage;
