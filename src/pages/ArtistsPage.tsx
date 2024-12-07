import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { RECORD_LABELS } from '../constants/labels';
import { generateId } from '../utils/idGenerator';
import { spotifyService } from '../services/SpotifyService';
import { Track } from '../types/track';
import type { SpotifyApi } from '@spotify/web-api-ts-sdk';

interface Artist {
  id: string;
  name: string;
  bio: string;
  image: string;
  imageUrl: string;
  recordLabel: string;
  spotifyId?: string | null;
  spotifyUrl?: string | null;
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
}

type LabelType = 'RECORDS' | 'TECH' | 'DEEP';

interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

const getArtists = async (label: LabelType): Promise<Artist[]> => {
  console.log('Getting artists for label:', label);
  
  // Get tracks from localStorage
  const storedTracks = localStorage.getItem('tracks');
  console.log('Stored tracks:', storedTracks);
  
  if (!storedTracks) {
    console.log('No tracks found in localStorage');
    return [];
  }
  
  try {
    const allTracks = JSON.parse(storedTracks) as Track[];
    console.log('Parsed tracks:', allTracks);
    
    // Get unique artists by label
    const labelValue = RECORD_LABELS[label];
    console.log('Looking for artists with label:', labelValue);
    
    const filteredTracks = allTracks.filter((track: Track) => {
      return track.recordLabel === labelValue;
    });
    
    console.log('Filtered tracks:', filteredTracks);
    
    // Get stored artist images from localStorage
    const storedArtistImages = localStorage.getItem('artistImages') || '{}';
    const artistImages = JSON.parse(storedArtistImages) as Record<string, string>;

    const artistsByLabel = filteredTracks.reduce<{ [key: string]: { artist: Artist; latestArtwork: string } }>((artists, track) => {
      const artistName = track.artist;
      if (!artists[artistName]) {
        const defaultImage = 'https://via.placeholder.com/300';
        // Use stored image if available, otherwise use album cover
        const storedImage = artistImages[artistName];
        const imageToUse = storedImage || track.albumCover || defaultImage;
        
        artists[artistName] = {
          artist: {
            id: generateId(),
            name: artistName,
            image: imageToUse,
            imageUrl: imageToUse,
            bio: `Artist on ${labelValue}`,
            recordLabel: labelValue,
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

    console.log('Artists by label:', artistsByLabel);

    // Convert to array
    const artistsArray = Object.values(artistsByLabel);

    // Only fetch Spotify images for artists that don't have a stored image
    const artistsToUpdate = artistsArray.filter(({ artist }) => !artistImages[artist.name]);
    console.log('Artists needing Spotify images:', artistsToUpdate.length);

    if (artistsToUpdate.length > 0) {
      // Add delay between Spotify API calls to prevent rate limiting
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Process artists in smaller batches
      const batchSize = 5;
      for (let i = 0; i < artistsToUpdate.length; i += batchSize) {
        const batch = artistsToUpdate.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ artist }) => {
            try {
              // Try to find a track by this artist
              const artistTracks = filteredTracks.filter(track => track.artist === artist.name);
              const firstTrack = artistTracks[0];

              console.log(`Fetching Spotify details for artist: ${artist.name}`);
              const spotifyArtist = await spotifyService.getArtistDetailsByName(artist.name, firstTrack?.trackTitle);
              if (spotifyArtist) {
                console.log(`Found Spotify images for ${artist.name}:`, spotifyArtist.images);

                // Get the highest quality image
                const bestImage = spotifyArtist.images
                  .filter((img: SpotifyImage) => img && img.width !== null)
                  .sort((a: SpotifyImage, b: SpotifyImage) => ((b.width || 0) - (a.width || 0)))[0];

                if (bestImage) {
                  artist.image = bestImage.url;
                  artist.spotifyId = spotifyArtist.id;
                  artist.spotifyUrl = spotifyArtist.external_urls.spotify;
                }
              }
            } catch (error) {
              console.error(`Error fetching Spotify image for ${artist.name}:`, error);
            }
          })
        );
        
        // Add delay between batches
        if (i + batchSize < artistsToUpdate.length) {
          await delay(1000); // 1 second delay between batches
        }
      }
    }
    
    return artistsArray.map(({ artist }) => artist);
  } catch (error) {
    console.error('Error loading artists:', error);
    return [];
  }
};

const ArtistsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const pathParts = location.pathname.split('/');
      const labelFromPath = pathParts[1]?.toUpperCase() as LabelType;
      
      if (!labelFromPath || !['RECORDS', 'TECH', 'DEEP'].includes(labelFromPath)) {
        console.error('Invalid label from path:', labelFromPath);
        setError('Invalid label');
        setLoading(false);
        return;
      }

      console.log('Loading artists for label:', labelFromPath);
      setLoading(true);
      setError(null);
      
      try {
        const fetchedArtists = await getArtists(labelFromPath);
        console.log('Fetched artists:', fetchedArtists);
        setArtists(fetchedArtists);
      } catch (err) {
        console.error('Error in loadData:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading artists');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.pathname]);

  const filteredAndSortedArtists = React.useMemo(() => {
    return artists
      .filter(artist => 
        artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.bio.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [artists, searchTerm, sortOrder]);

  const handleArtistClick = (artist: Artist) => {
    const label = location.pathname.split('/')[1]; // Get current label (records/tech/deep)
    navigate(`/${label}/artists/${encodeURIComponent(artist.name)}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search Artists"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sort Order</InputLabel>
          <Select
            value={sortOrder}
            label="Sort Order"
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <MenuItem value="asc">A to Z</MenuItem>
            <MenuItem value="desc">Z to A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          <Box sx={{ p: 3 }}>Loading artists...</Box>
        ) : error ? (
          <Box sx={{ p: 3, color: 'error.main' }}>{error}</Box>
        ) : filteredAndSortedArtists.length === 0 ? (
          <Box sx={{ p: 3 }}>No artists found</Box>
        ) : (
          filteredAndSortedArtists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s ease-in-out'
                  }
                }}
                onClick={() => handleArtistClick(artist)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={artist.imageUrl || 'https://via.placeholder.com/300x300.png?text=' + encodeURIComponent(artist.name)}
                  alt={artist.name}
                  sx={{
                    objectFit: 'cover',
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {artist.name}
                  </Typography>
                  <Typography>
                    {artist.bio}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default ArtistsPage;
