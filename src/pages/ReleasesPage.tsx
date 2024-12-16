import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 10;

interface ReleaseGroupProps {
  mainTrack: Track;
  versions: Track[];
}

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

const ReleaseGroup: React.FC<ReleaseGroupProps> = ({ mainTrack, versions }) => {
  const [expanded, setExpanded] = useState(false);
  const hasVersions = versions.length > 1;

  return (
    <ReleaseCard>
      <CardMedia
        component="img"
        sx={{
          width: '100%',
          aspectRatio: '1/1',
          objectFit: 'cover',
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}
        image={mainTrack.albumCover || 'https://via.placeholder.com/300'}
        alt={mainTrack.trackTitle}
        loading="lazy"
      />
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'text.primary',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {mainTrack.trackTitle}
          </Typography>
          {hasVersions && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </Box>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {mainTrack.artist}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {new Date(mainTrack.releaseDate).toLocaleDateString()}
        </Typography>
        
        <Box sx={{ mt: { xs: 1, sm: 2 }, display: 'flex', gap: 1 }}>
          {mainTrack.beatportUrl && (
            <IconLink href={mainTrack.beatportUrl} target="_blank">
              <SiBeatport size={20} />
            </IconLink>
          )}
          {mainTrack.spotifyUrl && (
            <IconLink href={mainTrack.spotifyUrl} target="_blank">
              <FaSpotify size={20} />
            </IconLink>
          )}
          {mainTrack.soundcloudUrl && (
            <IconLink href={mainTrack.soundcloudUrl} target="_blank">
              <FaSoundcloud size={20} />
            </IconLink>
          )}
        </Box>

        {expanded && hasVersions && (
          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Other Versions:
            </Typography>
            {versions.slice(1).map((version) => (
              <Box key={version.id} sx={{ mt: 1 }}>
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {version.trackTitle.includes('(') 
                    ? version.trackTitle.match(/\((.*?)\)/)?.[1] || 'Original Mix'
                    : 'Original Mix'}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {new Date(version.releaseDate).toLocaleDateString()}
                </Typography>
                <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
                  {version.beatportUrl && (
                    <IconLink href={version.beatportUrl} target="_blank">
                      <SiBeatport size={16} />
                    </IconLink>
                  )}
                  {version.spotifyUrl && (
                    <IconLink href={version.spotifyUrl} target="_blank">
                      <FaSpotify size={16} />
                    </IconLink>
                  )}
                  {version.soundcloudUrl && (
                    <IconLink href={version.soundcloudUrl} target="_blank">
                      <FaSoundcloud size={16} />
                    </IconLink>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </ReleaseCard>
  );
};

interface ReleasesPageProps {
  label: LabelKey;
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastTrackElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const loadTracks = () => {
      const data = getData();
      const labelTracks = data.tracks.filter(track => 
        track.recordLabel.toLowerCase() === RECORD_LABELS[label].toLowerCase()
      );
      
      // Sort tracks by release date (newest first)
      const sortedTracks = labelTracks.sort((a, b) => {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB.getTime() - dateA.getTime();
      });

      setTracks(sortedTracks);
      setLoading(false);
    };

    loadTracks();
  }, [label]);

  const currentTracks = tracks.slice(0, page * ITEMS_PER_PAGE);
  const hasMoreTracks = currentTracks.length < tracks.length;

  // Helper function to format popularity score
  const formatPopularity = (popularity?: number) => {
    if (popularity === undefined) return '';
    return `${popularity}% Popular`;
  };

  const topTracks = useMemo(() => {
    return [...tracks]
      .sort((a, b) => ((b.popularity || 0) - (a.popularity || 0)))
      .slice(0, 10);
  }, [tracks]);

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
      mt: { xs: 8, sm: 10 },
      width: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1,
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.3)',
        }
      }}>
        {/* Featured Section Container */}
        <Box sx={{ 
          p: { xs: 1, sm: 4 },
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <Box 
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 2,
              p: { xs: 1, sm: 4 },
              mb: { xs: 4, sm: 8 },
              boxSizing: 'border-box',
              width: '100%'
            }}
          >
            <Grid container spacing={{ xs: 1, sm: 4 }} sx={{ position: 'relative', zIndex: 1 }}>
              {/* Featured Release */}
              <Grid item xs={12} md={8}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    mb: { xs: 2, sm: 3 },
                    fontWeight: 'bold',
                    color: '#fff',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  Featured Release
                </Typography>
                {currentTracks.length > 0 && (
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
                        image={currentTracks[0].albumCover}
                        alt={currentTracks[0].trackTitle}
                      />
                    </Box>
                    <Box sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      p: { xs: 2, sm: 4 },
                      minHeight: '300px' // Ensure minimum height for content
                    }}>
                      <Box>
                        <Typography variant="h5" sx={{ color: '#fff', mb: { xs: 2, sm: 3 } }}>
                          {currentTracks[0].trackTitle}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#B0B0B0', mb: { xs: 2, sm: 3 } }}>
                          {currentTracks[0].artist}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, mb: { xs: 2, sm: 4 }, alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                              RELEASED
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#fff' }}>
                              {new Date(currentTracks[0].releaseDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2,
                        flexDirection: 'column'
                      }}>
                        {currentTracks[0].spotifyUrl && (
                          <IconLink 
                            href={currentTracks[0].spotifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1,
                              bgcolor: 'rgba(29, 185, 84, 0.1)',
                              p: { xs: 1, sm: 2 },
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
                        {currentTracks[0].beatportUrl && (
                          <IconLink 
                            href={currentTracks[0].beatportUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1,
                              bgcolor: 'rgba(0, 162, 255, 0.1)',
                              p: { xs: 1, sm: 2 },
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
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.3)', 
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      mb: { xs: 2, sm: 3 },
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: '#fff',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    Top 10 Most Plays on Spotify
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    {topTracks.slice(0, 10).map((track, index) => (
                      <Box
                        key={track.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: { xs: 1, sm: 2 },
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
                            fontSize: { xs: '0.875rem', sm: '1rem' }
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
                            width: { xs: 48, sm: 56 }, 
                            height: { xs: 48, sm: 56 },
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
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                fontWeight: 500
                              }}
                            >
                              {track.trackTitle}
                            </Typography>
                            <Typography 
                              noWrap
                              sx={{ 
                                color: '#B0B0B0',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
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
                              display: { xs: 'none', sm: 'flex' },
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
          <Box sx={{ 
            mt: { xs: 4, sm: 8 }, 
            pt: { xs: 2, sm: 4 },
            position: 'relative',
            zIndex: 0
          }}>
            <Typography variant="h5" sx={{ mb: { xs: 2, sm: 3 }, color: '#fff' }}>
              Catalog
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 4 }}>
              {currentTracks.slice(1).map((track, index) => (
                <Grid item xs={12} sm={6} md={3} key={track.id} ref={index === currentTracks.length - 2 ? lastTrackElementRef : null}>
                  <ReleaseCard sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 'none' }
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
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'text.primary',
                          fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                      >
                        {track.trackTitle}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {track.artist}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {new Date(track.releaseDate).toLocaleDateString()}
                      </Typography>
                      
                      <Box sx={{ mt: { xs: 1, sm: 2 }, display: 'flex', gap: 1 }}>
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
          </Box>

          {loading && (
            <LoadingContainer>
              <CircularProgress />
            </LoadingContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ReleasesPage;
