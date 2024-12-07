import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { spotifyService } from '../services/SpotifyService';
import { Track, SpotifyImage } from '../types/track';

interface Artist {
  name: string;
  bio: string;
  image: string;
  spotifyId?: string;
  spotifyUrl?: string;
  tracks: Track[];
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

        // Create basic artist data
        const artistData: Artist = {
          name: artistName,
          bio: '',
          image: '',
          tracks: artistTracks
        };

        // Try to get Spotify artist details
        const firstTrack = artistTracks[0];
        const spotifyArtist = await spotifyService.getArtistDetailsByName(artistName, firstTrack?.trackTitle);
        
        if (spotifyArtist) {
          console.log('Found Spotify artist:', spotifyArtist.name);
          
          if (spotifyArtist.images && spotifyArtist.images.length > 0) {
            const bestImage = spotifyArtist.images
              .sort((a: SpotifyImage, b: SpotifyImage) => (b.width || 0) - (a.width || 0))[0];
            
            if (bestImage?.url) {
              console.log('Using image URL:', bestImage.url);
              artistData.image = bestImage.url;
            }
          }

          artistData.spotifyId = spotifyArtist.id;
          if (spotifyArtist.external_urls?.spotify) {
            artistData.spotifyUrl = spotifyArtist.external_urls.spotify;
          }
        } else {
          console.log('No Spotify artist found for:', artistName);
        }

        setArtist(artistData);
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
        <Typography>Loading artist details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!artist) {
    return (
      <Container>
        <Typography>Artist not found</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Artist Image and Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="300"
                image={artist.image || 'https://via.placeholder.com/300'}
                alt={artist.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h5" component="h1" gutterBottom>
                  {artist.name}
                </Typography>
                {artist.spotifyUrl && (
                  <Typography>
                    <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">
                      View on Spotify
                    </a>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Artist Tracks */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Releases
            </Typography>
            <Grid container spacing={2}>
              {artist.tracks.map((track, index) => (
                <Grid item xs={12} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {track.trackTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Label: {track.recordLabel}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ArtistDetailPage;
