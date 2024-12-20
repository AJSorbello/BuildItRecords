import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Track } from '../types/track';
import { RECORD_LABELS } from '../constants/labels';
import { LabelKey } from '../types/labels';
import { redisService } from '../services/RedisService';

const ITEMS_PER_PAGE = 20;

const ReleaseCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(1),
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  position: 'relative',
  zIndex: 1,
  maxWidth: '100%',
  boxSizing: 'border-box'
}));

const IconLink = styled('a')({
  color: '#fff',
  marginRight: '12px',
  textDecoration: 'none',
  transition: 'color 0.2s ease-in-out',
  '&:hover': {
    color: '#1DB954',
  },
});

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
});

interface ReleasesPageProps {
  label: LabelKey;
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [displayedTracks, setDisplayedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Fetch tracks from Redis
  useEffect(() => {
    const loadTracks = async () => {
      try {
        setError(null);
        setLoading(true);
        const tracks = await redisService.getTracksForLabel(RECORD_LABELS[label]);
        if (tracks) {
          const sortedTracks = tracks.sort((a, b) => {
            const dateA = new Date(a.releaseDate);
            const dateB = new Date(b.releaseDate);
            return dateB.getTime() - dateA.getTime();
          });
          setAllTracks(sortedTracks);
          setDisplayedTracks(sortedTracks.slice(0, ITEMS_PER_PAGE));
          setHasMore(sortedTracks.length > ITEMS_PER_PAGE);
        } else {
          setError('No releases found');
        }
      } catch (err) {
        console.error('Error loading tracks:', err);
        setError('Failed to load releases');
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [label]);

  // Memoize top tracks by popularity
  const topTracks = useMemo(() => {
    return [...allTracks]
      .sort((a, b) => ((b.popularity || 0) - (a.popularity || 0)))
      .slice(0, 10);
  }, [allTracks]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingRef.current) {
          loadMoreTracks();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    const sentinel = document.querySelector('#releases-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadMoreTracks = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    const currentLength = displayedTracks.length;
    
    try {
      const nextTracks = allTracks.slice(
        currentLength,
        currentLength + ITEMS_PER_PAGE
      );

      setDisplayedTracks(prev => [...prev, ...nextTracks]);
      setHasMore(currentLength + ITEMS_PER_PAGE < allTracks.length);
    } catch (err) {
      console.error('Error loading more tracks:', err);
    } finally {
      loadingRef.current = false;
    }
  }, [displayedTracks.length, allTracks, hasMore]);

  if (loading && !displayedTracks.length) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 8, sm: 10 } }}>
      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {displayedTracks.map((track, index) => (
              <Grid item xs={12} sm={6} key={`${track.id}-${index}`}>
                <ReleaseCard>
                  <CardMedia
                    component="img"
                    height="300"
                    image={track.albumCover || 'https://via.placeholder.com/300'}
                    alt={track.trackTitle}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="h6" noWrap title={track.trackTitle}>
                      {track.trackTitle}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" noWrap>
                      {track.artist}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(track.releaseDate).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {track.spotifyUrl && (
                        <IconLink href={track.spotifyUrl} target="_blank" rel="noopener noreferrer">
                          <FaSpotify size={24} />
                        </IconLink>
                      )}
                      {track.beatportUrl && (
                        <IconLink href={track.beatportUrl} target="_blank" rel="noopener noreferrer">
                          <SiBeatport size={24} />
                        </IconLink>
                      )}
                      {track.soundcloudUrl && (
                        <IconLink href={track.soundcloudUrl} target="_blank" rel="noopener noreferrer">
                          <FaSoundcloud size={24} />
                        </IconLink>
                      )}
                    </Box>
                  </CardContent>
                </ReleaseCard>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Top 10 Tracks Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.3)', 
            p: 3,
            borderRadius: 2,
            position: 'sticky',
            top: 100
          }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#fff',
                mb: 3
              }}
            >
              Top 10 Most Plays on Spotify
            </Typography>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              {topTracks.map((track, index) => (
                <Box
                  key={track.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Typography sx={{ minWidth: '24px', color: '#B0B0B0' }}>
                    {index + 1}.
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flex: 1,
                    minWidth: 0
                  }}>
                    <Box sx={{ 
                      width: 48,
                      height: 48,
                      position: 'relative',
                      flexShrink: 0,
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      <Box
                        component="img" 
                        src={track.albumCover} 
                        alt={track.trackTitle}
                        sx={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography 
                        noWrap
                        sx={{ 
                          color: '#fff',
                          fontWeight: 500
                        }}
                      >
                        {track.trackTitle}
                      </Typography>
                      <Typography 
                        noWrap
                        sx={{ color: '#B0B0B0' }}
                      >
                        {track.artist}
                      </Typography>
                    </Box>
                    {track.spotifyUrl && (
                      <IconLink 
                        href={track.spotifyUrl} 
                        target="_blank"
                        sx={{ color: '#1DB954' }}
                      >
                        <FaSpotify size={20} />
                      </IconLink>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Sentinel element for infinite scroll */}
      {hasMore && (
        <Box id="releases-sentinel" sx={{ height: '20px', my: 4 }} />
      )}

      {loading && displayedTracks.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ReleasesPage;
