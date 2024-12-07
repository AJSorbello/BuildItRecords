import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { spotifyService } from '../services/SpotifyService';
import { Track, SpotifyImage } from '../types/track';

interface Artist {
  name: string;
  bio: string;
  image: string;
  images?: SpotifyImage[];
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

        // Try to get Spotify artist details using the first track
        const firstTrack = artistTracks[0];
        if (firstTrack) {
          console.log('Using track for artist search:', {
            title: firstTrack.trackTitle,
            artist: firstTrack.artist,
            label: firstTrack.recordLabel
          });

          // Remove any "Original Mix" or "Remix" suffixes from track title for better search
          const cleanTrackTitle = firstTrack.trackTitle.replace(/[\s-]+(Original Mix|Remix)$/i, '');
          const spotifyArtist = await spotifyService.getArtistDetailsByName(artistName, cleanTrackTitle);

          if (spotifyArtist) {
            console.log('Found Spotify artist from track:', {
              name: spotifyArtist.name,
              id: spotifyArtist.id,
              url: spotifyArtist.external_urls?.spotify
            });

            if (spotifyArtist.images && spotifyArtist.images.length > 0) {
              artistData.images = spotifyArtist.images;
              const bestImage = spotifyArtist.images[0]; // Spotify returns images sorted by size
              
              console.log('Using artist image:', {
                url: bestImage.url,
                width: bestImage.width,
                height: bestImage.height
              });
              
              artistData.image = bestImage.url;
            } else {
              console.log('No profile images found for artist');
              artistData.image = 'https://via.placeholder.com/300?text=No+Profile+Image';
            }

            artistData.spotifyId = spotifyArtist.id;
            if (spotifyArtist.external_urls?.spotify) {
              artistData.spotifyUrl = spotifyArtist.external_urls.spotify;
            }
          } else {
            console.log('No Spotify artist found using track:', firstTrack.trackTitle);
            artistData.image = 'https://via.placeholder.com/300?text=Artist+Not+Found';
          }
        } else {
          console.log('No tracks found for artist:', artistName);
          artistData.image = 'https://via.placeholder.com/300?text=No+Tracks+Found';
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
                  <Card sx={{ display: 'flex', backgroundColor: '#333', color: '#FFFFFF' }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 100, height: 100 }}
                      image={track.albumCover || 'https://via.placeholder.com/100'}
                      alt={track.trackTitle}
                    />
                    <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle1" sx={{ color: '#FFFFFF' }}>
                            {track.trackTitle}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                            {track.artist}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                            {track.recordLabel}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                            {track.releaseDate ? new Date(track.releaseDate).toLocaleDateString() : 'Unknown'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
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
