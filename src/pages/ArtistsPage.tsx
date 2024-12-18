import React, { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { RECORD_LABELS } from '../constants/labels';
import { generateId } from '../utils/idGenerator';
import { spotifyService } from '../services/SpotifyService';
import { Track } from '../types/track';
import type { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';

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

const getArtists = async (label: LabelType): Promise<{ artists: Artist[], totalCount: number }> => {
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
    }
    
    const now = Date.now();
    const artistTrackMap = new Map<string, { tracks: Track[]; artist: Artist }>();
    
    // Filter and group tracks by artist
    const filteredTracks = allTracks.filter(track => {
      if (!track.recordLabel) {
        console.warn('Track missing record label:', track);
        return false;
      }
      const isMatch = track.recordLabel.toLowerCase() === labelValue.toLowerCase();
      console.log(`Track ${track.trackTitle} label match: ${isMatch}`);
      return isMatch;
    });
    
    console.log('Filtered tracks for label:', filteredTracks.length);
    
    // Process tracks and build artist map
    for (const track of filteredTracks) {
      const artistName = track.artist?.trim();
      if (!artistName) {
        console.warn('Track missing artist name:', track);
        continue;
      }
      
      try {
        const artistEntry = artistTrackMap.get(artistName);
        if (!artistEntry) {
          const cachedData = artistCache[artistName];
          const isValidCache = cachedData && (now - cachedData.timestamp) < CACHE_DURATION;
          
          if (isValidCache) {
            console.log(`Using cached data for artist: ${artistName}`);
            artistTrackMap.set(artistName, {
              tracks: [track],
              artist: cachedData.artist
            });
          } else {
            console.log(`Creating new artist entry for: ${artistName}`);
            
            // Try to fetch artist profile image from Spotify
            let artistImage = 'https://via.placeholder.com/300?text=Artist+Image';
            try {
              if (track.spotifyUrl) {
                const artistId = track.spotifyUrl.split('/artist/')[1]?.split('?')[0];
                if (artistId) {
                  const spotifyArtist = await spotifyService.getArtist(artistId);
                  if (spotifyArtist.images && spotifyArtist.images.length > 0) {
                    artistImage = spotifyArtist.images[0].url;
                  }
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch Spotify image for ${artistName}:`, error);
            }
            
            const newArtist: Artist = {
              id: generateId(),
              name: artistName,
              bio: '',
              image: artistImage,
              imageUrl: artistImage,
              recordLabel: labelValue,
              spotifyUrl: track.spotifyUrl || null,
              beatportUrl: track.beatportUrl,
              soundcloudUrl: track.soundcloudUrl
            };
            
            artistTrackMap.set(artistName, {
              tracks: [track],
              artist: newArtist
            });
            
            // Update cache
            artistCache[artistName] = {
              artist: newArtist,
              timestamp: now
            };
          }
        } else {
          artistEntry.tracks.push(track);
          
          // Update URLs if they're not set
          if (!artistEntry.artist.spotifyUrl && track.spotifyUrl) {
            artistEntry.artist.spotifyUrl = track.spotifyUrl;
            
            // Try to update artist image if it's still using placeholder
            if (artistEntry.artist.imageUrl.includes('placeholder')) {
              try {
                const artistId = track.spotifyUrl.split('/artist/')[1]?.split('?')[0];
                if (artistId) {
                  const spotifyArtist = await spotifyService.getArtist(artistId);
                  if (spotifyArtist.images && spotifyArtist.images.length > 0) {
                    artistEntry.artist.imageUrl = spotifyArtist.images[0].url;
                    artistEntry.artist.image = spotifyArtist.images[0].url;
                  }
                }
              } catch (error) {
                console.warn(`Failed to fetch Spotify image for ${artistName}:`, error);
              }
            }
          }
          if (!artistEntry.artist.beatportUrl && track.beatportUrl) {
            artistEntry.artist.beatportUrl = track.beatportUrl;
          }
          if (!artistEntry.artist.soundcloudUrl && track.soundcloudUrl) {
            artistEntry.artist.soundcloudUrl = track.soundcloudUrl;
          }
        }
      } catch (error) {
        console.error(`Error processing track for artist ${artistName}:`, error);
        continue;
      }
    }
    
    // Save updated cache
    try {
      localStorage.setItem('cachedArtists', JSON.stringify(artistCache));
    } catch (error) {
      console.warn('Error saving artist cache:', error);
    }
    
    // Convert map to array and sort alphabetically
    const allArtists = Array.from(artistTrackMap.values())
      .map(entry => entry.artist)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Returning ${allArtists.length} artists`);
    return {
      artists: allArtists,
      totalCount: allArtists.length
    };
    
  } catch (error) {
    console.error('Error in getArtists:', error);
    throw error;
  }
};

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const label = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('label') || 'RECORDS') as LabelType;
  }, [location.search]);

  useEffect(() => {
    const loadArtists = async () => {
      console.log('Starting to load artists...');
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching artists for label:', label);
        const { artists: fetchedArtists } = await getArtists(label);
        console.log('Successfully fetched artists:', fetchedArtists.length);
        setArtists(fetchedArtists);
      } catch (err) {
        console.error('Error loading artists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load artists');
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, [label]);

  const handleLabelChange = (event: any) => {
    const newLabel = event.target.value as LabelType;
    console.log('Label changed to:', newLabel);
    navigate(`/artists?label=${newLabel}`);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        color: 'error.main',
        bgcolor: 'error.light',
        borderRadius: 1,
        m: 2
      }}>
        <Typography variant="h6">Error Loading Artists</Typography>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 8, sm: 10 } }}>
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth>
          <InputLabel id="label-select-label">Record Label</InputLabel>
          <Select
            labelId="label-select-label"
            value={label}
            label="Record Label"
            onChange={handleLabelChange}
          >
            {Object.entries(RECORD_LABELS).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {artists.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No artists found for {RECORD_LABELS[label]}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {artists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={artist.imageUrl || 'https://via.placeholder.com/300'}
                  alt={artist.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {artist.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2
                  }}>
                    {artist.bio || `Artist on ${RECORD_LABELS[label as LabelType]}`}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    justifyContent: 'flex-start',
                    mt: 'auto'
                  }}>
                    {artist.spotifyUrl && (
                      <IconButton
                        href={artist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ color: '#1DB954' }}
                      >
                        <FaSpotify />
                      </IconButton>
                    )}
                    {artist.beatportUrl && (
                      <IconButton
                        href={artist.beatportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ color: '#02FF95' }}
                      >
                        <SiBeatport />
                      </IconButton>
                    )}
                    {artist.soundcloudUrl && (
                      <IconButton
                        href={artist.soundcloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{ color: '#FF3300' }}
                      >
                        <FaSoundcloud />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ArtistsPage;
