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
  imageUrl: string;
  bio: string;
  recordLabel: string;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
  bandcampUrl: string;
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
      .filter((track: Track) => track.recordLabel === RECORD_LABELS[label])
      .reduce<{ [key: string]: { artist: Artist; latestArtwork: string } }>((artists, track) => {
        // Update or create artist entry
        if (!artists[track.artist]) {
          const defaultImage = 'https://via.placeholder.com/300';
          artists[track.artist] = {
            artist: {
              id: generateId(),
              name: track.artist,
              image: track.albumCover || defaultImage,
              imageUrl: track.albumCover || defaultImage,
              bio: `Artist on ${RECORD_LABELS[label]}`,
              recordLabel: RECORD_LABELS[label],
              spotifyUrl: track.spotifyUrl || '',
              beatportUrl: '',
              soundcloudUrl: '',
              bandcampUrl: ''
            },
            latestArtwork: track.albumCover || defaultImage
          };
        }
        return artists;
      }, {});

    // Convert to array and add Spotify images where available
    const artistsArray = Object.values(artistsByLabel);
    const artistsWithImages = await Promise.all(
      artistsArray.map(async ({ artist, latestArtwork }) => {
        try {
          // Try to get Spotify image
          const spotifyArtist = await spotifyService.getArtistDetails(artist.name);
          // Check if we have valid images array and it's not empty
          if (spotifyArtist && spotifyArtist.images && Array.isArray(spotifyArtist.images) && spotifyArtist.images.length > 0) {
            // Use the highest quality image
            const images = [...spotifyArtist.images]; // Create a copy to avoid mutating original
            const bestImage = images.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
            if (bestImage && bestImage.url) {
              return {
                ...artist,
                image: bestImage.url,
                imageUrl: bestImage.url
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching Spotify image for ${artist.name}:`, error);
        }
        
        // Fall back to album artwork if Spotify image not available
        return {
          ...artist,
          image: latestArtwork,
          imageUrl: latestArtwork
        };
      })
    );

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
