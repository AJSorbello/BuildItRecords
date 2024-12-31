import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress, Container, IconButton, Collapse, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { RecordLabel, LABEL_DISPLAY_NAMES } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Artist } from '../types/artist';
import { FaSpotify } from 'react-icons/fa';
import { Release } from '../types/release';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedArtistData {
  artist: Artist;
  timestamp: number;
}

const getArtists = async (label: RecordLabel): Promise<{ artists: Artist[], totalCount: number }> => {
  console.log('Getting artists for label:', label);
  
  try {
    const artists = await databaseService.getArtistsForLabel(label);
    
    if (!artists || artists.length === 0) {
      console.log('No artists found in database');
      return { artists: [], totalCount: 0 };
    }
    
    return { 
      artists,
      totalCount: artists.length 
    };
  } catch (error) {
    console.error('Error fetching artists:', error);
    return { artists: [], totalCount: 0 };
  }
};

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
  const [showReleases, setShowReleases] = useState(false);

  return (
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
        image={artist.artworkUrl || artist.images?.[0]?.url || 'https://via.placeholder.com/300'}
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
          {artist.bio || `Artist on ${artist.label}`}
        </Typography>

        {/* Social Links */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          justifyContent: 'flex-start',
          mb: 2
        }}>
          {artist.external_urls?.spotify && (
            <IconButton
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: '#1DB954' }}
            >
              <FaSpotify />
            </IconButton>
          )}
        </Box>

        {/* Releases Section */}
        {artist.releases && artist.releases.length > 0 && (
          <>
            <Button
              onClick={() => setShowReleases(!showReleases)}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            >
              {showReleases ? 'Hide Releases' : `Show Releases (${artist.releases.length})`}
            </Button>
            <Collapse in={showReleases}>
              <Box sx={{ mt: 2 }}>
                {artist.releases.map((release) => (
                  <Box
                    key={release.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      boxShadow: 1
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                      image={release.artworkUrl || 'https://via.placeholder.com/60'}
                      alt={release.name}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {release.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(release.releaseDate).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {release.external_urls?.spotify && (
                          <IconButton
                            href={release.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ padding: 0.5 }}
                          >
                            <FaSpotify fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const label = (params.get('label') || RecordLabel.RECORDS) as RecordLabel;

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        const { artists: fetchedArtists } = await getArtists(label);
        setArtists(fetchedArtists);
        setError(null);
      } catch (err) {
        console.error('Error fetching artists:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchArtists();
  }, [label]);

  const handleLabelChange = (event: any) => {
    const newLabel = event.target.value as RecordLabel;
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('label', newLabel);
    navigate({ search: searchParams.toString() });
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="label-select-label">Record Label</InputLabel>
          <Select
            labelId="label-select-label"
            value={label}
            label="Record Label"
            onChange={handleLabelChange}
          >
            <MenuItem value={RecordLabel.RECORDS}>{LABEL_DISPLAY_NAMES[RecordLabel.RECORDS]}</MenuItem>
            <MenuItem value={RecordLabel.TECH}>{LABEL_DISPLAY_NAMES[RecordLabel.TECH]}</MenuItem>
            <MenuItem value={RecordLabel.DEEP}>{LABEL_DISPLAY_NAMES[RecordLabel.DEEP]}</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Artists
        </Typography>
        {artists.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No artists found for {LABEL_DISPLAY_NAMES[label]}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {artists.map((artist) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
                <ArtistCard artist={artist} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default ArtistsPage;
