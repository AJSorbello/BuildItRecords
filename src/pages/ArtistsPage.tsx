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

const getArtists = async (label: LabelType, page = 1, pageSize = 10): Promise<{ artists: Artist[], totalCount: number }> => {
  console.log('Getting artists for label:', label);
  
  try {
    // Get tracks from localStorage with error handling
    const storedTracks = localStorage.getItem('tracks');
    if (!storedTracks) {
      console.log('No tracks found in localStorage');
      return { artists: [], totalCount: 0 };
    }
    
    const allTracks = JSON.parse(storedTracks) as Track[];
    const labelValue = RECORD_LABELS[label];
    
    if (!labelValue) {
      console.error('Invalid label:', label);
      return { artists: [], totalCount: 0 };
    }
    
    console.log('Looking for tracks with label:', labelValue);
    console.log('Total tracks found:', allTracks.length);
    
    // Get cached artist data with error handling
    let artistCache: Record<string, CachedArtistData> = {};
    try {
      const cachedArtistsData = localStorage.getItem('cachedArtists');
      if (cachedArtistsData) {
        artistCache = JSON.parse(cachedArtistsData);
      }
    } catch (error) {
      console.warn('Error reading artist cache:', error);
      // Continue with empty cache
    }
    
    const now = Date.now();
    const artistTrackMap = new Map<string, { tracks: Track[]; artist: Artist }>();
    
    // Filter and group tracks by artist
    const filteredTracks = allTracks.filter(track => {
      if (!track.recordLabel) {
        console.warn('Track missing record label:', track);
        return false;
      }
      return track.recordLabel.toLowerCase() === labelValue.toLowerCase();
    });
    
    console.log('Filtered tracks for label:', filteredTracks.length);
    
    // Process tracks and build artist map
    for (const track of filteredTracks) {
      const artistName = track.artist?.trim();
      if (!artistName) {
        console.warn('Track missing artist name:', track);
        continue;
      }
      
      const artistEntry = artistTrackMap.get(artistName);
      if (!artistEntry) {
        const cachedData = artistCache[artistName];
        const isValidCache = cachedData && (now - cachedData.timestamp) < CACHE_DURATION;
        
        // Use track's album cover as the default image
        const defaultImage = track.albumCover || 'https://via.placeholder.com/300?text=Artist+Image';
        
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
        // Update artist image if current track has album cover and artist doesn't have image
        if (track.albumCover && (!artistEntry.artist.image || artistEntry.artist.image.includes('placeholder'))) {
          artistEntry.artist.image = track.albumCover;
          artistEntry.artist.imageUrl = track.albumCover;
        }
        // Update Spotify info if available
        if (track.spotifyUrl && !artistEntry.artist.spotifyUrl) {
          artistEntry.artist.spotifyUrl = track.spotifyUrl;
        }
      }
    }

    // Update cache with new artist data
    try {
      const newCache: Record<string, CachedArtistData> = {};
      artistTrackMap.forEach(({ artist }, artistName) => {
        newCache[artistName] = {
          artist,
          timestamp: now
        };
      });
      localStorage.setItem('cachedArtists', JSON.stringify(newCache));
    } catch (error) {
      console.warn('Error updating artist cache:', error);
    }

    // Convert to array and sort alphabetically
    const allArtists = Array.from(artistTrackMap.values())
      .map(({ artist }) => artist)
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalCount = allArtists.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedArtists = allArtists.slice(startIndex, endIndex);

    return { artists: paginatedArtists, totalCount };
  } catch (error) {
    console.error('Error getting artists:', error);
    return { artists: [], totalCount: 0 };
  }
};

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [totalArtists, setTotalArtists] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Get label from URL, defaulting to RECORDS if invalid or not present
  const getCurrentLabel = (): LabelType => {
    const pathParts = location.pathname.split('/');
    const labelFromPath = pathParts[1]?.toUpperCase() as LabelType;
    return ['RECORDS', 'TECH', 'DEEP'].includes(labelFromPath) ? labelFromPath : 'RECORDS';
  };

  const label = getCurrentLabel();
  const pageSize = 10;

  // Redirect to default route if on invalid path
  useEffect(() => {
    const currentLabel = getCurrentLabel();
    if (location.pathname === '/artists') {
      navigate('/records/artists');
    } else if (currentLabel === 'RECORDS' && location.pathname !== '/records/artists') {
      navigate('/records/artists');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const loadInitialArtists = async () => {
      try {
        setError(null);
        setLoading(true);
        const { artists: initialArtists, totalCount } = await getArtists(label, 1, pageSize);
        setAllArtists(initialArtists);
        setArtists(initialArtists);
        setTotalArtists(totalCount);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artists');
        console.error('Error loading artists:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialArtists();
  }, [label]);

  const loadMoreArtists = async () => {
    if (loading || artists.length >= totalArtists) return;
    
    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      const { artists: newArtists } = await getArtists(label, nextPage, pageSize);
      
      setAllArtists(prev => {
        const combined = [...prev, ...newArtists];
        return Array.from(new Map(combined.map(a => [a.id, a])).values())
          .sort((a, b) => a.name.localeCompare(b.name));
      });
      
      if (searchTerm) {
        const filteredNewArtists = newArtists.filter(artist => 
          artist.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setArtists(prev => {
          const combined = [...prev, ...filteredNewArtists];
          return Array.from(new Map(combined.map(a => [a.id, a])).values())
            .sort((a, b) => a.name.localeCompare(b.name));
        });
      } else {
        setArtists(prev => {
          const combined = [...prev, ...newArtists];
          return Array.from(new Map(combined.map(a => [a.id, a])).values())
            .sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Error loading more artists:', err);
      // Don't set error state here to avoid disrupting the UI
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.trim();
    setSearchTerm(searchValue);
    setCurrentPage(1);

    if (!searchValue) {
      setArtists(allArtists);
      setTotalArtists(allArtists.length);
    } else {
      const filtered = allArtists.filter(artist => 
        artist.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setArtists(filtered);
      setTotalArtists(filtered.length);
    }
  };

  // Intersection Observer setup with error handling
  useEffect(() => {
    if (!artists.length || loading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && artists.length < totalArtists) {
          loadMoreArtists();
        }
      },
      { threshold: 0.5 }
    );

    const sentinel = document.querySelector('#sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [artists.length, totalArtists, loading, error]);

  return (
    <Box sx={{ p: { xs: 4, sm: 3 }, mt: { xs: 8, sm: 10 } }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Artists"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: '100%', maxWidth: 300 }}
        />
      </Box>

      <Grid container spacing={3}>
        {artists.map((artist) => (
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

      {error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Sentinel element for infinite scroll */}
      {!loading && artists.length < totalArtists && (
        <Box id="sentinel" sx={{ height: '20px', my: 4 }} />
      )}

      {!loading && artists.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>No artists found</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ArtistsPage;
