import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Link, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import PageLayout from '../components/PageLayout';

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

const FeaturedReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  marginBottom: '48px',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.01)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

interface Release {
  id: string;
  title: string;
  artist: string;
  label: string;
  catalogNumber: string;
  releaseDate: string;
  artwork: string;
  beatportUrl?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
}

interface ReleasesPageProps {
  label: 'records' | 'tech' | 'deep';
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  // Mock data - replace with actual data from your backend
  const releases: Release[] = [
    {
      id: '1',
      title: 'Latest Release Title',
      artist: 'Featured Artist',
      label: `Build It ${label}`,
      catalogNumber: 'BIR001',
      releaseDate: '2024-01-15',
      artwork: 'https://via.placeholder.com/500x500.png?text=Latest+Release',
      beatportUrl: 'https://www.beatport.com',
      spotifyUrl: 'https://open.spotify.com',
      soundcloudUrl: 'https://soundcloud.com',
    },
    // Previous releases
    {
      id: '2',
      title: 'Previous Release 1',
      artist: 'Artist Name',
      label: `Build It ${label}`,
      catalogNumber: 'BIR002',
      releaseDate: '2023-12-01',
      artwork: 'https://via.placeholder.com/300x300.png?text=Release+2',
    },
    {
      id: '3',
      title: 'Previous Release 2',
      artist: 'Another Artist',
      label: `Build It ${label}`,
      catalogNumber: 'BIR003',
      releaseDate: '2023-11-15',
      artwork: 'https://via.placeholder.com/300x300.png?text=Release+3',
    },
    // Add more releases as needed
  ];

  const [featuredRelease, ...previousReleases] = releases;

  return (
    <PageLayout label={label}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
          Latest Release
        </Typography>

        <FeaturedReleaseCard>
          <Grid container>
            <Grid item xs={12} md={6}>
              <CardMedia
                component="img"
                height="500"
                image={featuredRelease.artwork}
                alt={featuredRelease.title}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                  {featuredRelease.title}
                </Typography>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  {featuredRelease.artist}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {featuredRelease.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Catalog: {featuredRelease.catalogNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Release Date: {new Date(featuredRelease.releaseDate).toLocaleDateString()}
                </Typography>
                <Box mt={3}>
                  {featuredRelease.beatportUrl && (
                    <IconLink href={featuredRelease.beatportUrl} target="_blank">
                      <SiBeatport size={32} />
                    </IconLink>
                  )}
                  {featuredRelease.spotifyUrl && (
                    <IconLink href={featuredRelease.spotifyUrl} target="_blank">
                      <FaSpotify size={32} />
                    </IconLink>
                  )}
                  {featuredRelease.soundcloudUrl && (
                    <IconLink href={featuredRelease.soundcloudUrl} target="_blank">
                      <FaSoundcloud size={32} />
                    </IconLink>
                  )}
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </FeaturedReleaseCard>

        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mt: 6 }}>
          Previous Releases
        </Typography>

        <Grid container spacing={3}>
          {previousReleases.map((release) => (
            <Grid item xs={12} sm={6} md={4} key={release.id}>
              <ReleaseCard>
                <CardMedia
                  component="img"
                  height="300"
                  image={release.artwork}
                  alt={release.title}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {release.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {release.artist}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {release.catalogNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(release.releaseDate).toLocaleDateString()}
                  </Typography>
                  <Box mt={2}>
                    <IconLink href="#" target="_blank">
                      <SiBeatport size={24} />
                    </IconLink>
                    <IconLink href="#" target="_blank">
                      <FaSpotify size={24} />
                    </IconLink>
                    <IconLink href="#" target="_blank">
                      <FaSoundcloud size={24} />
                    </IconLink>
                  </Box>
                </CardContent>
              </ReleaseCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ReleasesPage;
