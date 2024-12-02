import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import { LabelKey } from '../types/labels';
import { RECORD_LABELS } from '../constants/labels';
import { Track } from '../types/track';
import { spotifyService } from '../services/SpotifyService';

interface Artist {
  id: string;
  name: string;
  image: string;
  bio: string;
}

interface ArtistsPageProps {
  label: LabelKey;
}

// Helper function to generate a simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const getArtists = async (label: LabelKey): Promise<Artist[]> => {
  // Get tracks from localStorage
  const storedTracks = localStorage.getItem('tracks');
  if (!storedTracks) return [];
  
  try {
    const allTracks = JSON.parse(storedTracks) as Track[];
    console.log('All tracks:', allTracks);
    
    // Get unique artists by label
    const artistsByLabel = allTracks
      .filter((track: Track) => {
        const matches = track.recordLabel === RECORD_LABELS[label];
        console.log('Track label match?', {
          trackLabel: track.recordLabel,
          requiredLabel: RECORD_LABELS[label],
          matches
        });
        return matches;
      })
      .reduce<{ [key: string]: { artist: Artist; latestArtwork: string } }>((artists, track) => {
        // Update or create artist entry
        if (!artists[track.artist]) {
          artists[track.artist] = {
            artist: {
              id: generateId(),
              name: track.artist,
              image: 'https://via.placeholder.com/300', // Will be updated with Spotify image
              bio: `Artist on ${RECORD_LABELS[label]}`
            },
            latestArtwork: track.albumCover || 'https://via.placeholder.com/300'
          };
        } else if (track.albumCover) {
          // Update latest artwork if available
          artists[track.artist].latestArtwork = track.albumCover;
        }
        return artists;
      }, {});

    // Fetch Spotify artist images
    const artistsWithImages = await Promise.all(
      Object.values(artistsByLabel).map(async ({ artist, latestArtwork }) => {
        try {
          const spotifyArtist = await spotifyService.getArtistDetails(artist.name);
          if (spotifyArtist && spotifyArtist.images.length > 0) {
            // Use the highest quality image
            const bestImage = spotifyArtist.images.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
            return {
              ...artist,
              image: bestImage.url
            };
          }
          // If no Spotify image, use the latest release artwork
          return {
            ...artist,
            image: latestArtwork
          };
        } catch (error) {
          console.error('Error fetching Spotify artist image:', error);
          return {
            ...artist,
            image: latestArtwork
          };
        }
      })
    );

    console.log('Artists with images:', artistsWithImages);
    return artistsWithImages;
  } catch (error) {
    console.error('Error loading artists:', error);
    return [];
  }
};

const ArtistsPage: React.FC<ArtistsPageProps> = ({ label }) => {
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadArtists = async () => {
      setLoading(true);
      try {
        const loadedArtists = await getArtists(label);
        setArtists(loadedArtists);
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
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Loading artists...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Artists
      </Typography>

      <Grid container spacing={4}>
        {artists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} key={artist.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease-in-out',
              },
            }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="300"
                  image={artist.image}
                  alt={artist.name}
                  sx={{ 
                    objectFit: 'cover',
                    filter: 'brightness(0.9)',
                  }}
                />
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
                    {artist.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    {artist.bio}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ArtistsPage;
