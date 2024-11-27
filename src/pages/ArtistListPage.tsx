import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, styled, Grid, CardContent } from '@mui/material';
import PageLayout from '../components/PageLayout';
import { Release } from '../types/release';

interface Artist {
  name: string;
  releases: Release[];
  genres: string[];
}

const groupByArtists = (releases: Release[]): Artist[] => {
  const artistMap = new Map<string, Artist>();

  releases.forEach(release => {
    if (!artistMap.has(release.artist)) {
      artistMap.set(release.artist, {
        name: release.artist,
        releases: [],
        genres: [],
      });
    }
    const artist = artistMap.get(release.artist)!;
    artist.releases.push(release);
  });

  return Array.from(artistMap.values());
};

const filterByLabel = (artists: Artist[], label: 'records' | 'tech' | 'deep'): Artist[] => {
  return artists.filter(artist => 
    artist.releases.some(release => 
      release.beatportUrl?.includes(label) || 
      release.soundcloudUrl?.includes(label)
    )
  );
};

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
}));

const ArtistListPage: React.FC = () => {
  const { label } = useParams<{ label: 'records' | 'tech' | 'deep' }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const releases = await fetch('/api/releases').then(res => res.json());
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
              <StyledCard>
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
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ArtistListPage;
