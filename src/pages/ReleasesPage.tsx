import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import { LoadingSpinner, ErrorMessage } from '../components';
import { useReleases } from '../hooks/useReleases';
import { useLocation } from 'react-router-dom';
import { RECORD_LABELS } from '../constants/labels';

const ITEMS_PER_PAGE = 10;

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

const ReleasesPage: React.FC = () => {
  const location = useLocation();
  const labelId = `buildit-${location.pathname.split('/')[1]}`;
  const { loading, error, releases } = useReleases({ label: labelId });
  const [page, setPage] = useState(1);

  // Get the latest release
  const latestRelease = useMemo(() => {
    if (!releases?.length) return null;
    return releases[0];
  }, [releases]);

  // Get top 10 tracks by popularity
  const topReleases = useMemo(() => {
    if (!releases?.length) return [];
    return [...releases]
      .sort((a, b) => ((b.popularity || 0) - (a.popularity || 0)))
      .slice(0, 10);
  }, [releases]);

  // Get catalog releases (excluding the latest)
  const catalogReleases = useMemo(() => {
    if (!releases?.length) return [];
    return releases.slice(1);
  }, [releases]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!releases?.length) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          No releases found
        </Typography>
      </Box>
    );
  }

  const label = RECORD_LABELS[labelId];
  const labelDisplayName = label?.displayName || 'Releases';

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
        maxWidth: '1200px',
        mx: 'auto',
        mt: 2,
        px: 2
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {labelDisplayName}
        </Typography>

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
                    Latest Release
                  </Typography>
                  {latestRelease && (
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
                          image={latestRelease.artwork_url}
                          alt={latestRelease.name}
                        />
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: { xs: 2, md: 4 },
                        minHeight: '300px'
                      }}>
                        <Box>
                          <Typography variant="h5" sx={{ color: '#fff', mb: { xs: 2, md: 3 } }}>
                            {latestRelease.name}
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#B0B0B0', mb: { xs: 2, md: 3 } }}>
                            {latestRelease.artists.map(artist => artist.name).join(', ')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 3, mb: { xs: 2, md: 4 }, alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                                RELEASED
                              </Typography>
                              <Typography variant="body1" sx={{ color: '#fff' }}>
                                {new Date(latestRelease.release_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2,
                          flexDirection: 'column'
                        }}>
                          {latestRelease.spotifyUrl && (
                            <IconLink 
                              href={latestRelease.spotifyUrl} 
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
                          {latestRelease.beatportUrl && (
                            <IconLink 
                              href={latestRelease.beatportUrl} 
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
                      Top 10 Most Popular
                    </Typography>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      {topReleases.map((release, index) => (
                        <Box
                          key={release.id}
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
                            minWidth: 0
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
                                src={release.artwork_url} 
                                alt={release.name}
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
                                {release.name}
                              </Typography>
                              <Typography 
                                noWrap
                                sx={{ 
                                  color: '#B0B0B0',
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {release.artists.map(artist => artist.name).join(', ')}
                              </Typography>
                            </Box>
                          </Box>
                          {release.spotifyUrl && (
                            <IconLink 
                              href={release.spotifyUrl} 
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
            <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
              Catalog
            </Typography>
            <Grid container spacing={{ xs: 2, md: 4 }}>
              {catalogReleases.map((release) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
                  <ReleaseCard>
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
                        image={release.artwork_url}
                        alt={release.name}
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
                        {release.name}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                      >
                        {release.artists.map(artist => artist.name).join(', ')}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {new Date(release.release_date).toLocaleDateString()}
                      </Typography>
                      
                      <Box sx={{ mt: { xs: 1, md: 2 }, display: 'flex', gap: 1 }}>
                        {release.beatportUrl && (
                          <IconLink href={release.beatportUrl} target="_blank">
                            <SiBeatport size={20} />
                          </IconLink>
                        )}
                        {release.spotifyUrl && (
                          <IconLink href={release.spotifyUrl} target="_blank">
                            <FaSpotify size={20} />
                          </IconLink>
                        )}
                        {release.soundcloudUrl && (
                          <IconLink href={release.soundcloudUrl} target="_blank">
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
        </Box>
      </Box>
    </Box>
  );
};

export default ReleasesPage;
