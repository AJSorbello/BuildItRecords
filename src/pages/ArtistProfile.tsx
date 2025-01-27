import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { ArtistCard } from '../components/ArtistCard';
import config from '../config';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  followers: { total: number };
  popularity: number;
  external_urls: {
    spotify?: string;
    instagram?: string;
    soundcloud?: string;
  };
}

interface Release {
  id: string;
  name: string;
  type: string;
  release_date: string;
  images: { url: string }[];
  artists: {
    id: string;
    name: string;
  }[];
}

const ArtistProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        
        // Fetch artist details
        const artistResponse = await axios.get(`${config.API_URL}/artists/${id}`);
        setArtist(artistResponse.data);
        
        // Fetch releases (including collaborations)
        const releasesResponse = await axios.get(`${config.API_URL}/artists/${id}/releases`);
        setReleases(releasesResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load artist data');
        setLoading(false);
        console.error('Error fetching artist data:', err);
      }
    };

    if (id) {
      fetchArtistData();
    }
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !artist) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography color="error">{error || 'Artist not found'}</Typography>
      </Box>
    );
  }

  const soloReleases = releases.filter(release => release.artists.length === 1);
  const collaborations = releases.filter(release => release.artists.length > 1);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <ArtistCard
            name={artist.name}
            imageUrl={artist.images[0]?.url || '/default-artist-image.jpg'}
            bio={`${artist.genres.join(', ')}\n\n${artist.followers.total.toLocaleString()} followers`}
            spotifyUrl={artist.external_urls.spotify}
            instagramUrl={artist.external_urls.instagram}
            soundcloudUrl={artist.external_urls.soundcloud}
            label="records"
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                mb: 3,
                '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .Mui-selected': { color: 'white' },
              }}
            >
              <Tab label="Solo Releases" />
              <Tab label="Collaborations" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {tabValue === 0 ? (
                soloReleases.length > 0 ? (
                  soloReleases.map((release) => (
                    <Paper
                      key={release.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          bgcolor: 'rgba(255, 255, 255, 0.04)',
                        },
                      }}
                    >
                      <img
                        src={release.images[1]?.url || '/default-album-image.jpg'}
                        alt={release.name}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                      <Box>
                        <Typography
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {release.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {new Date(release.release_date).getFullYear()} • {release.type}
                        </Typography>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No solo releases found
                  </Typography>
                )
              ) : (
                collaborations.length > 0 ? (
                  collaborations.map((release) => (
                    <Paper
                      key={release.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          bgcolor: 'rgba(255, 255, 255, 0.04)',
                        },
                      }}
                    >
                      <img
                        src={release.images[1]?.url || '/default-album-image.jpg'}
                        alt={release.name}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {release.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          with {release.artists.filter(a => a.id !== id).map(a => a.name).join(', ')}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          {new Date(release.release_date).getFullYear()} • {release.type}
                        </Typography>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No collaborations found
                  </Typography>
                )
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ArtistProfile;
