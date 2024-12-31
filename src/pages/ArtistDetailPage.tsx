import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { spotifyService } from '../services/SpotifyService';
import { Artist } from '../types/artist';
import { Track } from '../types/track';
import PlaylistTrackList from '../components/PlaylistTrackList';

const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const artistData = await spotifyService.getArtist(id);
        if (!artistData) {
          throw new Error('Artist not found');
        }
        setArtist(artistData);

        // Fetch artist's top tracks
        const results = await spotifyService.searchTracks(`artist:${artistData.name}`);
        setTracks(results);
      } catch (err) {
        console.error('Error fetching artist:', err);
        setError('Failed to load artist data');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !artist) {
    return (
      <Container>
        <Typography color="error" align="center">
          {error || 'Artist not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              image={artist.artworkUrl || artist.images[0]?.url || 'https://via.placeholder.com/300'}
              alt={artist.name}
              sx={{ height: 300, objectFit: 'cover' }}
            />
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {artist.name}
              </Typography>
              {artist.genres.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Genres
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {artist.genres.map((genre) => (
                      <Typography
                        key={genre}
                        variant="body2"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {genre}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
              <Typography variant="body1" sx={{ mb: 2 }}>
                {artist.bio || `Artist on ${artist.label}`}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {artist.followers.total.toLocaleString()} followers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Top Tracks
          </Typography>
          <PlaylistTrackList tracks={tracks} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default ArtistDetailPage;
