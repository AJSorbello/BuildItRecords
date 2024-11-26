import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, styled } from '@mui/material';
import PageLayout from '../components/PageLayout';
import { useParams } from 'react-router-dom';
import { Artist, parseCSV, groupByArtists, filterByLabel } from '../utils/csvParser';

const ArtistCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const ArtistListPage = () => {
  const { label } = useParams<{ label: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const releases = await parseCSV('');  // The path is now handled in parseCSV
        const allArtists = groupByArtists(releases);
        const filteredArtists = filterByLabel(allArtists, label || 'records');
        setArtists(filteredArtists);
      } catch (error) {
        console.error('Error loading artists:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, [label]);

  if (loading) {
    return (
      <PageLayout label={label || 'records'}>
        <Typography>Loading artists...</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout label={label || 'records'}>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
          Artists ({artists.length})
        </Typography>
        <Grid container spacing={3}>
          {artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} key={artist.name}>
              <ArtistCard>
                <CardContent>
                  <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
                    {artist.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {artist.genres.join(', ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Releases: {artist.releases.length}
                  </Typography>
                </CardContent>
              </ArtistCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ArtistListPage;
