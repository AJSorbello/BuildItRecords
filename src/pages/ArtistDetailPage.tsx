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
  name: string;
  bio: string;
  image: string;
  images?: SpotifyImage[];
  spotifyId?: string;
  spotifyUrl?: string;
  instagramUrl?: string;
  soundcloudUrl?: string;
  tracks: Track[];
  followers?: number;
  genres?: string[];
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
        for (const track of artistTracks) {
          if (spotifyArtist) break;
          
          const cleanTrackTitle = track.trackTitle.replace(/[\s-]+(Original Mix|Remix)$/i, '');
          spotifyArtist = await spotifyService.getArtistDetailsByName(artistName, cleanTrackTitle);
        }

        if (spotifyArtist) {
          setArtist({
            name: spotifyArtist.name,
            bio: spotifyArtist.genres?.join(', ') || '',
            image: spotifyArtist.images?.[0]?.url || artistTracks[0]?.albumCover || 'https://via.placeholder.com/300?text=No+Profile+Image',
            images: spotifyArtist.images,
            spotifyId: spotifyArtist.id,
            spotifyUrl: spotifyArtist.external_urls?.spotify,
            tracks: artistTracks,
            followers: spotifyArtist.followers?.total,
            genres: spotifyArtist.genres
          });
        } else if (artistTracks.length > 0) {
          // Use the first release's artwork as artist image
          setArtist({
            name: artistName,
            bio: '',
            image: artistTracks[0].albumCover || 'https://via.placeholder.com/300?text=No+Profile+Image',
            tracks: artistTracks
          });
        } else {
          setArtist({
            name: artistName,
            bio: '',
            image: 'https://via.placeholder.com/300?text=No+Tracks+Found',
            tracks: []
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
                image={artist.image}
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
                {artist.followers && (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    {artist.followers.toLocaleString()} followers
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
                  {artist.instagramUrl && (
                    <IconButton
                      component={Link}
                      href={artist.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'white', '&:hover': { color: '#E1306C' } }}
                    >
                      <InstagramIcon />
                    </IconButton>
                  )}
                  {artist.soundcloudUrl && (
                    <IconButton
                      component={Link}
                      href={artist.soundcloudUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'white', '&:hover': { color: '#FF3300' } }}
                    >
                      <SoundcloudIcon />
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
                {artist.tracks.map((track, index) => (
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
                        image={track.albumCover || 'https://via.placeholder.com/60'}
                        alt={track.trackTitle}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                          {track.trackTitle}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {track.recordLabel}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : 'Unknown'}
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
