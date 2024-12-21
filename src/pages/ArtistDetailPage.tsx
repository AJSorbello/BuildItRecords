import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Paper,
  IconButton,
  Link,
} from '@mui/material';
import SpotifyIcon from '@mui/icons-material/MusicNote';
import InstagramIcon from '@mui/icons-material/Instagram';
import SoundcloudIcon from '@mui/icons-material/CloudQueue';
import { spotifyService } from '../services/SpotifyService';
import { Track, SpotifyImage } from '../types/track';

interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  recordLabel: string;
  labels: string[];
  releases: any[];
  spotifyUrl: string;
  genres: string[];
}

const ArtistDetailPage: React.FC = () => {
  const { artistName } = useParams<{ artistName: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistDetails = async () => {
      if (!artistName) return;

      try {
        setLoading(true);
        setError(null);

        // Get tracks from localStorage
        const storedTracks = localStorage.getItem('tracks');
        const tracks: Track[] = storedTracks ? JSON.parse(storedTracks) : [];
        
        // Find tracks by this artist
        const artistTracks = tracks.filter(track => 
          track.artist.toLowerCase() === artistName.toLowerCase()
        );

        // Try to get Spotify artist details using tracks
        let spotifyArtist = null;
        spotifyArtist = await spotifyService.getArtistDetailsByName(artistName);
        if (spotifyArtist) {
          setArtist({
            ...spotifyArtist,
            monthlyListeners: spotifyArtist.followers?.total,
            genres: spotifyArtist.genres || []
          });
        } else if (artistTracks.length > 0) {
          // Use the first release's artwork as artist image
          setArtist({
            id: artistTracks[0].artists[0].id,
            name: artistTracks[0].artists[0].name,
            imageUrl: artistTracks[0].albumCover,
            recordLabel: 'Records',
            labels: ['Records'],
            releases: [],
            spotifyUrl: artistTracks[0].artists[0].spotifyUrl,
            genres: []
          });
        } else {
          setArtist({
            id: '',
            name: artistName,
            imageUrl: 'https://via.placeholder.com/300?text=No+Tracks+Found',
            recordLabel: 'Records',
            labels: ['Records'],
            releases: [],
            spotifyUrl: '',
            genres: []
          });
        }
      } catch (err) {
        console.error('Error fetching artist details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load artist details');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistDetails();
  }, [artistName]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography>Loading artist details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  if (!artist) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography>Artist not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Artist Image and Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
              <CardMedia
                component="img"
                height="300"
                image={artist.imageUrl}
                alt={artist.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h5" component="h1" gutterBottom sx={{ color: 'white' }}>
                  {artist.name}
                </Typography>
                {artist.genres && artist.genres.length > 0 && (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                    {artist.genres.join(', ')}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {artist.spotifyUrl && (
                    <IconButton
                      component={Link}
                      href={artist.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'white', '&:hover': { color: '#1DB954' } }}
                    >
                      <SpotifyIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Releases */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                Releases
              </Typography>
              <Grid container spacing={2}>
                {artist.releases.map((release, index) => (
                  <Grid item xs={12} key={index}>
                    <Paper
                      sx={{
                        p: 2,
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
                      <CardMedia
                        component="img"
                        sx={{ width: 60, height: 60, borderRadius: 1 }}
                        image={release.imageUrl || 'https://via.placeholder.com/60'}
                        alt={release.title}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                          {release.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {release.recordLabel}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString() : 'Unknown'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ArtistDetailPage;
