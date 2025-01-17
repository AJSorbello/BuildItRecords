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
import { spotifyService } from '../services/spotify';
import type { Artist } from '../types/artist';
import type { Track } from '../types/track';
import type { Album } from '../types/album';
import PlayableTrackList from '../components/common/PlayableTrackList';

const ArtistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) {
        setError('Artist ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [artistData, topTracks, artistAlbums] = await Promise.all([
          spotifyService.getArtist(id),
          spotifyService.getArtistTopTracks(id),
          spotifyService.getArtistAlbums(id)
        ]);

        if (!artistData) {
          throw new Error('Artist not found');
        }

        setArtist(artistData);
        setTracks(topTracks);
        setAlbums(artistAlbums);
      } catch (err) {
        console.error('Error fetching artist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load artist data');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !artist) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          {error || 'Artist not found'}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            {artist.images?.[0]?.url && (
              <CardMedia
                component="img"
                image={artist.images[0].url}
                alt={artist.name}
                sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
              />
            )}
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                {artist.name}
              </Typography>
              {artist.genres?.length > 0 && (
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {artist.genres.join(', ')}
                </Typography>
              )}
              {artist.followers && (
                <Typography variant="body2" color="text.secondary">
                  {artist.followers.total.toLocaleString()} followers
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h5" component="h2" gutterBottom>
            Top Tracks
          </Typography>
          <PlayableTrackList tracks={tracks} />

          {albums.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Albums
              </Typography>
              <Grid container spacing={2}>
                {albums.map((album) => (
                  <Grid item xs={12} sm={6} md={4} key={album.id}>
                    <Card>
                      {album.images?.[0]?.url && (
                        <CardMedia
                          component="img"
                          image={album.images[0].url}
                          alt={album.name}
                          sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        />
                      )}
                      <CardContent>
                        <Typography variant="subtitle1" noWrap>
                          {album.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {album.release_date?.split('-')[0]}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ArtistDetailPage;
