import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Track } from '../types/track';
import { RECORD_LABELS } from '../constants/labels';
import { LabelKey } from '../types/labels';
import { getData } from '../utils/dataInitializer';

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
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const loadTracks = () => {
      setLoading(true);
      const data = getData();
      const labelTracks = data.tracks.filter(track => 
        track.recordLabel.toLowerCase() === RECORD_LABELS[label].toLowerCase()
      );
      
      const sortedTracks = labelTracks.sort((a, b) => {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB.getTime() - dateA.getTime();
      });

      setAllTracks(sortedTracks);
      setDisplayedTracks(sortedTracks.slice(0, ITEMS_PER_PAGE));
      setHasMore(sortedTracks.length > ITEMS_PER_PAGE);
      setLoading(false);
    };

    loadTracks();
  }, [label]);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.offsetHeight - 800; // Load more when 800px from bottom

      if (scrollPosition > threshold) {
        loadMoreTracks();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, displayedTracks.length]);

  const loadMoreTracks = () => {
    const currentLength = displayedTracks.length;
    const nextTracks = allTracks.slice(
      currentLength,
      currentLength + ITEMS_PER_PAGE
    );
    
    if (nextTracks.length > 0) {
      setDisplayedTracks(prev => [...prev, ...nextTracks]);
      setHasMore(currentLength + nextTracks.length < allTracks.length);
    } else {
      setHasMore(false);
    }
  };

  const topTracks = useMemo(() => {
    return [...allTracks]
      .sort((a, b) => ((b.popularity || 0) - (a.popularity || 0)))
      .slice(0, 10);
  }, [allTracks]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      mt: { xs: 8, md: 10 },
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '900px',
        mx: 'auto',
        mt: 2,
        px: 2
      }}>
        <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3, width: '100%' }}>
          <Box sx={{ 
            p: { xs: '16px 8px', md: '24px 16px' },
            boxSizing: 'border-box',
            width: '100%'
          }}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
                p: { xs: '16px 8px', md: '24px 16px' },
                mb: { xs: 4, md: 8 },
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <Grid container spacing={{ xs: 1, md: 4 }} sx={{ position: 'relative', zIndex: 1 }}>
                {/* Featured Release */}
                <Grid item xs={12} xl={8}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      mb: { xs: 2, md: 3 },
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: { xs: '1.25rem', md: '1.5rem' }
                    }}
                  >
                    Featured Release
                  </Typography>
                  {displayedTracks.length > 0 && (
                    <ReleaseCard sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      height: 'auto',
                      maxHeight: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      position: 'relative',
                      zIndex: 1,
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <Box sx={{ 
                        width: '100%',
                        position: 'relative',
                        paddingTop: '100%',
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}>
                        <CardMedia
                          component="img"
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          image={displayedTracks[0].albumCover}
                          alt={displayedTracks[0].trackTitle}
                        />
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: { xs: 2, md: 4 },
                        minHeight: '300px' // Ensure minimum height for content
                      }}>
                        <Box>
                          <Typography variant="h5" sx={{ color: '#fff', mb: { xs: 2, md: 3 } }}>
                            {displayedTracks[0].trackTitle}
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#B0B0B0', mb: { xs: 2, md: 3 } }}>
                            {displayedTracks[0].artist}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 3, mb: { xs: 2, md: 4 }, alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                                RELEASED
                              </Typography>
                              <Typography variant="body1" sx={{ color: '#fff' }}>
                                {new Date(displayedTracks[0].releaseDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2,
                          flexDirection: 'column'
                        }}>
                          {displayedTracks[0].spotifyUrl && (
                            <IconLink 
                              href={displayedTracks[0].spotifyUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                bgcolor: 'rgba(29, 185, 84, 0.1)',
                                p: { xs: 1, md: 2 },
                                borderRadius: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(29, 185, 84, 0.2)',
                                  transform: 'scale(1.02)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <FaSpotify size={24} />
                              <Typography variant="button" sx={{ color: '#fff', fontSize: '1rem' }}>
                                Play on Spotify
                              </Typography>
                            </IconLink>
                          )}
                          {displayedTracks[0].beatportUrl && (
                            <IconLink 
                              href={displayedTracks[0].beatportUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                bgcolor: 'rgba(0, 162, 255, 0.1)',
                                p: { xs: 1, md: 2 },
                                borderRadius: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(0, 162, 255, 0.2)',
                                  transform: 'scale(1.02)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <SiBeatport size={24} />
                              <Typography variant="button" sx={{ color: '#fff', fontSize: '1rem' }}>
                                Buy on Beatport
                              </Typography>
                            </IconLink>
                          )}
                        </Box>
                      </Box>
                    </ReleaseCard>
                  )}
                </Grid>

                {/* Top 10 Tracks */}
                <Grid item xs={12} xl={4}>
                  <Box sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.3)', 
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        mb: { xs: 2, md: 3 },
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: { xs: '1.25rem', md: '1.5rem' }
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
                            p: { xs: 1, md: 2 },
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 1,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Typography 
                            sx={{ 
                              minWidth: '24px',
                              color: '#B0B0B0',
                              fontSize: { xs: '0.875rem', md: '1rem' }
                            }}
                          >
                            {index + 1}.
                          </Typography>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flex: 1,
                            minWidth: 0 // Allows text truncation to work
                          }}>
                            <Box sx={{ 
                              width: { xs: 48, md: 56 }, 
                              height: { xs: 48, md: 56 },
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
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>
                            <Box sx={{ 
                              minWidth: 0,
                              flex: 1
                            }}>
                              <Typography 
                                noWrap
                                sx={{ 
                                  color: '#fff',
                                  fontSize: { xs: '0.875rem', md: '1rem' },
                                  fontWeight: 500
                                }}
                              >
                                {track.trackTitle}
                              </Typography>
                              <Typography 
                                noWrap
                                sx={{ 
                                  color: '#B0B0B0',
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {track.artist}
                              </Typography>
                            </Box>
                          </Box>
                          {track.spotifyUrl && (
                            <IconLink 
                              href={track.spotifyUrl} 
                              target="_blank"
                              sx={{ 
                                display: { xs: 'none', md: 'flex' },
                                color: '#1DB954'
                              }}
                            >
                              <FaSpotify size={20} />
                            </IconLink>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Catalog Section */}
            <Grid container spacing={3} sx={{ p: 3 }}>
              {displayedTracks.slice(1).map((track, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={track.id || index}>
                  <ReleaseCard sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', md: 'none' }
                  }}>
                    <Box sx={{ 
                      width: '100%',
                      position: 'relative',
                      paddingTop: '100%',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}>
                      <CardMedia
                        component="img"
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        image={track.albumCover}
                        alt={track.trackTitle}
                      />
                    </Box>
                    <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'text.primary',
                          fontSize: { xs: '1rem', md: '1.25rem' }
                        }}
                      >
                        {track.trackTitle}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                      >
                        {track.artist}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {new Date(track.releaseDate).toLocaleDateString()}
                      </Typography>
                      
                      <Box sx={{ mt: { xs: 1, md: 2 }, display: 'flex', gap: 1 }}>
                        {track.beatportUrl && (
                          <IconLink href={track.beatportUrl} target="_blank">
                            <SiBeatport size={20} />
                          </IconLink>
                        )}
                        {track.spotifyUrl && (
                          <IconLink href={track.spotifyUrl} target="_blank">
                            <FaSpotify size={20} />
                          </IconLink>
                        )}
                        {track.soundcloudUrl && (
                          <IconLink href={track.soundcloudUrl} target="_blank">
                            <FaSoundcloud size={20} />
                          </IconLink>
                        )}
                      </Box>
                    </CardContent>
                  </ReleaseCard>
                </Grid>
              ))}
            </Grid>

            {/* Loading indicator */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* No more releases indicator */}
            {!hasMore && displayedTracks.length > 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  color: 'text.secondary' 
                }}
              >
                No more releases to load
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReleasesPage;
