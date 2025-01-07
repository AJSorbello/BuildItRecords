import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, Card, CardContent, CardMedia, Link, CardActionArea } from '@mui/material';
import { useReleases } from '../hooks/useReleases';
import { Track } from '../types/Track';
import { Artist } from '../types/Artist';
import { Release } from '../types/Release';
import ReleaseModal from '../components/releases/ReleaseModal';
import ArtistModal from '../components/artists/ArtistModal';
import { useLocation } from 'react-router-dom';

const ReleasesPage: React.FC = () => {
  // Get label from URL path (e.g., /tech/releases -> tech)
  const location = useLocation();
  const labelId = `buildit-${location.pathname.split('/')[1]}`;
  const { releases, topTracks, loading, error, hasMore, loadingMore, loadMore } = useReleases({ label: labelId });
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Add scroll event listener for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.pageYOffset;
      const threshold = document.documentElement.scrollHeight - 20; // 20px before bottom
      
      console.log('Scroll check:', {
        position: scrollPosition,
        threshold: threshold,
        windowHeight: window.innerHeight,
        pageYOffset: window.pageYOffset,
        scrollHeight: document.documentElement.scrollHeight,
        hasMore,
        loadingMore
      });

      if (scrollPosition >= threshold && hasMore && !loadingMore) {
        console.log('Loading more releases...');
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, loadingMore]);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const handleReleaseClick = (release: Release) => {
    setSelectedRelease(release);
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setSelectedRelease(null); // Close release modal when opening artist modal
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const latestRelease = releases[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Latest Release
      </Typography>
      
      <Grid container spacing={4}>
        {/* Latest Release */}
        <Grid item xs={12} md={6}>
          {latestRelease ? (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => handleReleaseClick(latestRelease)}>
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '1/1',
                    objectFit: 'cover'
                  }}
                  image={latestRelease.artwork_url || latestRelease.tracks?.[0]?.artwork_url || latestRelease.tracks?.[0]?.album?.artwork_url}
                  alt={latestRelease.name}
                />
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    {latestRelease.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {latestRelease.artists?.map((artist, index) => (
                      <React.Fragment key={artist.id}>
                        <Box
                          component="span"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArtistClick(artist);
                          }}
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {artist.name}
                        </Box>
                        {index < (latestRelease.artists?.length || 0) - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Release Date: {new Date(latestRelease.release_date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : (
            <Typography>No releases found</Typography>
          )}
        </Grid>

        {/* Top 10 Tracks */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Spotify Top 10 Listens
          </Typography>
          <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
            {topTracks.slice(0, 10).map((track: Track, index: number) => (
              <Card key={track.id} sx={{ mb: 2, display: 'flex', height: 80 }}>
                <CardMedia
                  component="img"
                  sx={{ width: 80, height: 80, flexShrink: 0 }}
                  image={track.artwork_url || track.album?.artwork_url || track.release?.artwork_url}
                  alt={track.name}
                />
                <CardContent sx={{ flex: '1 0 auto', py: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" component="div" noWrap>
                        {track.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {track.artists?.map((artist, index) => (
                          <React.Fragment key={artist.id}>
                            <Box
                              component="span"
                              onClick={() => handleArtistClick(artist)}
                              sx={{
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {artist.name}
                            </Box>
                            {index < (track.artists?.length || 0) - 1 ? ', ' : ''}
                          </React.Fragment>
                        ))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(track.duration_ms)}
                      </Typography>
                    </Box>
                    {track.spotify_url && (
                      <Link
                        href={track.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: 1, flexShrink: 0 }}
                      >
                        Spotify
                      </Link>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* All Releases */}
      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6 }}>
        All Releases
      </Typography>
      <Grid container spacing={4}>
        {releases.map((release) => (
          <Grid item key={release.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => handleReleaseClick(release)}>
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '1/1',
                    objectFit: 'cover'
                  }}
                  image={release.artwork_url || release.tracks?.[0]?.artwork_url || release.tracks?.[0]?.album?.artwork_url}
                  alt={release.name}
                />
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    {release.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {release.artists?.map((artist, index) => (
                      <React.Fragment key={artist.id}>
                        <Box
                          component="span"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArtistClick(artist);
                          }}
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {artist.name}
                        </Box>
                        {index < (release.artists?.length || 0) - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Release Date: {new Date(release.release_date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loadingMore && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Modals */}
      <ReleaseModal
        open={!!selectedRelease}
        onClose={() => setSelectedRelease(null)}
        release={selectedRelease}
        onArtistClick={handleArtistClick}
      />
      <ArtistModal
        open={!!selectedArtist}
        onClose={() => setSelectedArtist(null)}
        artist={selectedArtist}
      />
    </Container>
  );
};

export default ReleasesPage;
