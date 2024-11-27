import React from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, Link, Box, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import PageLayout from '../components/PageLayout';
import { getArtistsByLabel } from '../data/artists';

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

const ArtistCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
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

const FeaturedReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 600,
  margin: '0 auto',
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

const PlaylistCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const TechPage = () => {
  const techArtists = getArtistsByLabel('tech');

  // Mock data for top 10 most listened
  const topTenListens = [
    { id: '1', title: 'Tech House Anthem', artist: 'DJ Tech', plays: 15000 },
    { id: '2', title: 'Digital Dreams', artist: 'Producer X', plays: 12000 },
    { id: '3', title: 'Circuit Breaker', artist: 'Electronic Mind', plays: 10000 },
    // ... add more items
  ];

  const featuredReleases = [
    {
      id: '1',
      title: 'Tech House Revolution',
      artist: 'DJ Producer',
      catalogNumber: 'BIT001',
      genre: 'Tech House',
      style: 'Peak Time',
    },
    // ... other releases
  ];

  const latestRelease = featuredReleases[0];
  const pastReleases = featuredReleases.slice(1);

  const playlists = [
    {
      id: '1',
      title: 'Techno Essentials',
      description: 'The best in underground techno',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',
    },
    {
      id: '2',
      title: 'Peak Time Techno',
      description: 'Hard-hitting peak time selections',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX5xiztvBdlUf',
    },
  ];

  return (
    <PageLayout label="tech">
      <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
          Build It Tech
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
          Techno & Tech House
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
                  image={`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(latestRelease.title)}`}
                  alt={latestRelease.title}
                />
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="h4" component="div" sx={{ color: 'text.primary', mb: 1 }}>
                    {latestRelease.title}
                  </Typography>
                  <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {latestRelease.artist}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                      {latestRelease.catalogNumber}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {latestRelease.genre} {latestRelease.style ? `- ${latestRelease.style}` : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </FeaturedReleaseCard>
            </Box>

            {/* Past Releases Grid */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                Past Releases
              </Typography>
              <Grid container spacing={3}>
                {pastReleases.map((release) => (
                  <Grid item xs={12} sm={6} md={4} key={release.id}>
                    <ReleaseCard>
                      <CardMedia
                        component="img"
                        sx={{
                          height: 0,
                          paddingTop: '100%',
                          objectFit: 'cover'
                        }}
                        image={`https://via.placeholder.com/300x300.png?text=${encodeURIComponent(release.title)}`}
                        alt={release.title}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {release.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {release.artist}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {release.catalogNumber}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {release.genre} {release.style ? `- ${release.style}` : ''}
                          </Typography>
                        </Box>
                      </CardContent>
                    </ReleaseCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          {/* Right Sidebar - Top 10 Most Listened */}
          <Grid item xs={12} md={3}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: '24px' } }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Top 10 Most Listened
              </Typography>
              {topTenListens.map((track, index) => (
                <TopListenCard key={track.id}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'text.secondary', mr: 2, minWidth: '28px' }}>
                        {index + 1}
                      </Typography>
                      <Box>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {track.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {track.artist}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {track.plays.toLocaleString()} plays
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </TopListenCard>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default TechPage;
