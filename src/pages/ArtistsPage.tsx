import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, IconButton, Container } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { RECORD_LABELS } from '../constants/labels';
import { spotifyService } from '../services/SpotifyService';
import { databaseService } from '../services/DatabaseService';
import { Track } from '../types/track';
import type { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';

interface Artist {
  id: string;
  name: string;
  bio: string;
  images: SpotifyImage[];
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
    const artists = await databaseService.getArtistsForLabel(RECORD_LABELS['Build It Records']);
    if (!artists || artists.length === 0) {
      console.log('No artists found in database');
      return { artists: [], totalCount: 0 };
    }
    
    const transformedArtists = artists.map(artist => ({
      ...artist,
    }));
    
    return { 
      artists: transformedArtists,
      totalCount: artists.length 
    };
  } catch (error) {
    console.error('Error fetching artists:', error);
    return { artists: [], totalCount: 0 };
  }
};

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const label = (params.get('label') || 'RECORDS') as LabelType;

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsData = await databaseService.getArtistsForLabel(RECORD_LABELS['Build It Records']);
        setArtists(artistsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Artists
        </Typography>
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
              No artists found for {RECORD_LABELS['Build It Records']}
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
                    image={artist.images[0]?.url || 'https://via.placeholder.com/300'}
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
                      {artist.bio || `Artist on ${RECORD_LABELS['Build It Records']}`}
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
    </Container>
  );
};

export default ArtistsPage;
