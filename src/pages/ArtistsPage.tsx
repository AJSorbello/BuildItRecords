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
  const [artists, setArtists] = useState<Artist[]>([]);
  const [displayedArtists, setDisplayedArtists] = useState<Artist[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const label = location.pathname.split('/')[1]?.toUpperCase() as LabelType || 'RECORDS';

  useEffect(() => {
    const loadArtists = async () => {
      setLoading(true);
      const fetchedArtists = await getArtists(label);
      // Sort artists alphabetically by name
      const sortedArtists = fetchedArtists.sort((a, b) => a.name.localeCompare(b.name));
      setArtists(sortedArtists);
      setDisplayedArtists(sortedArtists.slice(0, visibleCount));
      setLoading(false);
    };
    loadArtists();
  }, [label]);

  useEffect(() => {
    const filtered = artists
      .filter(artist => artist.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)); // Keep sort order when filtering
    setDisplayedArtists(filtered.slice(0, visibleCount));
  }, [searchTerm, artists, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedArtists.length < artists.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [displayedArtists.length, artists.length]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setVisibleCount(10); // Reset visible count when searching
  };

  const handleLabelChange = (event: any) => {
    const newLabel = event.target.value as LabelType;
    navigate(`/${newLabel.toLowerCase()}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Artists"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: 300 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Label</InputLabel>
          <Select value={label} onChange={handleLabelChange} label="Label">
            <MenuItem value="RECORDS">Build It Records</MenuItem>
            <MenuItem value="TECH">Build It Tech</MenuItem>
            <MenuItem value="DEEP">Build It Deep</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {displayedArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="300"
                image={artist.imageUrl || artist.image}
                alt={artist.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {artist.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {artist.bio}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>Loading artists...</Typography>
        </Box>
      )}

      {/* Sentinel element for infinite scroll */}
      {!loading && displayedArtists.length < artists.length && (
        <Box id="sentinel" sx={{ height: '20px', my: 4 }} />
      )}

      {!loading && displayedArtists.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>No artists found</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ArtistsPage;
