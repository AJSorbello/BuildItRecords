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

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedArtistData {
  artist: Artist;
  timestamp: number;
}

const getArtists = async (label: LabelType): Promise<Artist[]> => {
  console.log('Getting artists for label:', label);
  
  // Get tracks from localStorage
  const storedTracks = localStorage.getItem('tracks');
  if (!storedTracks) {
    console.log('No tracks found in localStorage');
    return [];
  }
  
  try {
    const allTracks = JSON.parse(storedTracks) as Track[];
    const labelValue = RECORD_LABELS[label];
    
    console.log('Looking for tracks with label:', labelValue);
    console.log('Total tracks found:', allTracks.length);
    
    // Get cached artist data
    const cachedArtistsData = localStorage.getItem('cachedArtists');
    const artistCache: Record<string, CachedArtistData> = cachedArtistsData ? JSON.parse(cachedArtistsData) : {};
    const now = Date.now();

    // Create a Map for O(1) lookups
    const artistTrackMap = new Map<string, { tracks: Track[]; artist: Artist }>();
    
    // First pass: Group tracks by artist and create/update artist entries - O(n)
    const filteredTracks = allTracks.filter(track => 
      track.recordLabel.toLowerCase() === labelValue.toLowerCase()
    );
    console.log('Filtered tracks for label:', filteredTracks.length);
    
    filteredTracks.forEach(track => {
      const artistName = track.artist;
      const artistEntry = artistTrackMap.get(artistName);
      
      if (!artistEntry) {
        // Check cache first
        const cachedData = artistCache[artistName];
        const isValidCache = cachedData && (now - cachedData.timestamp) < CACHE_DURATION;
        
        const defaultImage = 'https://via.placeholder.com/300?text=Artist+Image';
        artistTrackMap.set(artistName, {
          tracks: [track],
          artist: isValidCache ? cachedData.artist : {
            id: generateId(),
            name: artistName,
            image: defaultImage,
            imageUrl: defaultImage,
            bio: `Artist on ${labelValue}`,
            recordLabel: labelValue,
            spotifyUrl: track.spotifyUrl || '',
            beatportUrl: '',
            soundcloudUrl: '',
            bandcampUrl: ''
          }
        });
      } else {
        artistEntry.tracks.push(track);
      }
    });

    // Convert to array for processing
    const artistsToProcess = Array.from(artistTrackMap.values());
    const uncachedArtists = artistsToProcess.filter(({ artist }) => {
      const cachedData = artistCache[artist.name];
      return !cachedData || (now - cachedData.timestamp) >= CACHE_DURATION;
    });

    // Process uncached artists in small batches to respect rate limits
    if (uncachedArtists.length > 0) {
      const batchSize = 3;
      const delay = 1100; // Slightly over 1 second to respect rate limits

      for (let i = 0; i < uncachedArtists.length; i += batchSize) {
        const batch = uncachedArtists.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ({ artist, tracks }) => {
            try {
              // Use the most recent track for artist lookup
              const latestTrack = tracks.reduce((latest, current) => {
                return new Date(current.releaseDate) > new Date(latest.releaseDate) ? current : latest;
              }, tracks[0]);

              if (latestTrack) {
                const cleanTrackTitle = latestTrack.trackTitle.replace(/[\s-]+(Original Mix|Remix)$/i, '');
                const primaryArtist = artist.name.split(/,|&/)[0].trim();
                
                const spotifyArtist = await spotifyService.getArtistDetailsByName(primaryArtist, cleanTrackTitle);

                // Safely handle potentially null/undefined values
                if (spotifyArtist && spotifyArtist.images && spotifyArtist.images.length > 0) {
                  const bestImage = spotifyArtist.images[0];
                  if (bestImage && bestImage.url) {
                    artist.image = bestImage.url;
                    artist.imageUrl = bestImage.url;
                    artist.spotifyId = spotifyArtist.id || null;
                    artist.spotifyUrl = spotifyArtist.external_urls?.spotify || null;
                    
                    // Update cache
                    artistCache[artist.name] = {
                      artist,
                      timestamp: now
                    };
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching Spotify data for ${artist.name}:`, error);
            }
          })
        );

        // Add delay between batches
        if (i + batchSize < uncachedArtists.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Save updated cache
      localStorage.setItem('cachedArtists', JSON.stringify(artistCache));
    }

    // Return all artists
    return artistsToProcess.map(({ artist }) => artist);
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
      
      // Clear cached artists for testing
      localStorage.removeItem('cachedArtists');
      spotifyService.clearCache();
      
      setLoading(true);
      setError(null);
      
      try {
        const loadedArtists = await getArtists(labelFromPath);
        console.log('Fetched artists:', loadedArtists);
        setArtists(loadedArtists);
      } catch (error) {
        console.error('Error loading artists:', error);
        setError('Failed to load artists');
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
