import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled, CircularProgress } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import useReleases from '../hooks/useReleases';
import { Release } from '../types/release';

interface ReleasesPageProps {
  label: 'records' | 'tech' | 'deep';
}

interface StyledLinkProps {
  hovercolor?: string;
}

const FeaturedReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 800,
  margin: '0 auto',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const TopListenCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  marginBottom: '8px',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const IconLink = styled(Link)<StyledLinkProps>(({ hovercolor }) => ({
  color: '#FFFFFF',
  display: 'inline-flex',
  alignItems: 'center',
  marginRight: '16px',
  textDecoration: 'none',
  transition: 'color 0.2s',
  '&:hover': {
    color: hovercolor || '#1DB954',
  },
}));

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const { releases, isLoading, error } = useReleases(label);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', color: 'error.main', py: 4 }}>
        <Typography variant="h6">Error loading releases: {error.message}</Typography>
      </Box>
    );
  }

  if (!releases.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">No releases found</Typography>
      </Box>
    );
  }

  const featuredRelease = releases[0];
  const pastReleases = releases.slice(1);
  const topListened = [...releases]
    .sort((a, b) => {
      const durationA = parseInt(a.tracks[0]?.duration || '0');
      const durationB = parseInt(b.tracks[0]?.duration || '0');
      return durationB - durationA;
    })
    .slice(0, 10);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
        {label === 'tech' ? 'Build It Tech' : label === 'deep' ? 'Build It Deep' : 'Build It Records'}
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
        {label === 'tech' ? 'Techno & Tech House' : label === 'deep' ? 'Deep House' : 'House Music'}
      </Typography>

      <Grid container spacing={4}>
        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          {/* Featured Release */}
          <Box mb={8}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Latest Release
            </Typography>
            <FeaturedReleaseCard>
              <CardMedia
                component="img"
                sx={{
                  height: 0,
                  paddingTop: '100%',
                  objectFit: 'cover'
                }}
                image={featuredRelease.artwork}
                alt={featuredRelease.title}
              />
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" component="div" sx={{ color: 'text.primary', mb: 1 }}>
                  {featuredRelease.title}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                  {featuredRelease.artist}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    {featuredRelease.releaseDate}
                  </Typography>
                  <Box mt={2}>
                    {featuredRelease.spotifyUrl && (
                      <IconLink href={featuredRelease.spotifyUrl} target="_blank" hovercolor="#1DB954">
                        <FaSpotify size={24} />
                      </IconLink>
                    )}
                    {featuredRelease.beatportUrl && (
                      <IconLink href={featuredRelease.beatportUrl} target="_blank" hovercolor="#02FF95">
                        <SiBeatport size={24} />
                      </IconLink>
                    )}
                    {featuredRelease.soundcloudUrl && (
                      <IconLink href={featuredRelease.soundcloudUrl} target="_blank" hovercolor="#FF3300">
                        <FaSoundcloud size={24} />
                      </IconLink>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </FeaturedReleaseCard>
          </Box>

          {/* Past Releases Grid */}
          <Box>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Past Releases
            </Typography>
            <Grid container spacing={3}>
              {pastReleases.map((release) => (
                <Grid item key={release.id} xs={12} sm={6} md={4}>
                  <ReleaseCard>
                    <CardMedia
                      component="img"
                      sx={{
                        height: 0,
                        paddingTop: '100%',
                        objectFit: 'cover'
                      }}
                      image={release.artwork}
                      alt={release.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                        {release.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        {release.artist}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {release.releaseDate}
                      </Typography>
                      <Box>
                        {release.spotifyUrl && (
                          <IconLink href={release.spotifyUrl} target="_blank" hovercolor="#1DB954">
                            <FaSpotify size={20} />
                          </IconLink>
                        )}
                        {release.beatportUrl && (
                          <IconLink href={release.beatportUrl} target="_blank" hovercolor="#02FF95">
                            <SiBeatport size={20} />
                          </IconLink>
                        )}
                        {release.soundcloudUrl && (
                          <IconLink href={release.soundcloudUrl} target="_blank" hovercolor="#FF3300">
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
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Most Popular
            </Typography>
            {topListened.map((release, index) => (
              <TopListenCard key={release.id}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {index + 1}. {release.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {release.artist}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {release.tracks[0]?.duration || '0:00'}
                  </Typography>
                  <Box mt={1}>
                    {release.spotifyUrl && (
                      <IconLink href={release.spotifyUrl} target="_blank" hovercolor="#1DB954">
                        <FaSpotify size={16} />
                      </IconLink>
                    )}
                    {release.beatportUrl && (
                      <IconLink href={release.beatportUrl} target="_blank" hovercolor="#02FF95">
                        <SiBeatport size={16} />
                      </IconLink>
                    )}
                    {release.soundcloudUrl && (
                      <IconLink href={release.soundcloudUrl} target="_blank" hovercolor="#FF3300">
                        <FaSoundcloud size={16} />
                      </IconLink>
                    )}
                  </Box>
                </CardContent>
              </TopListenCard>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReleasesPage;
