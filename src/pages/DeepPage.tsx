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

const PlaylistCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const DeepPage = () => {
  const deepArtists = getArtistsByLabel('deep');

  const playlists = [
    {
      id: '1',
      title: 'Deep House Essentials',
      description: 'The finest in deep house music',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
    {
      id: '2',
      title: 'Deep & Melodic',
      description: 'Melodic deep house selections',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
  ];

  return (
    <PageLayout label="deep">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
          Build It Deep
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
          Deep-House for the Underground
        </Typography>

        <Typography variant="h5" gutterBottom>
          Featured Release
        </Typography>
        <Card>
          <CardMedia
            component="img"
            height="300"
            image="https://via.placeholder.com/800x800.png?text=Featured+Deep+Release"
            alt="Featured Release"
          />
          <CardContent>
            <Typography variant="h6">Latest Deep House Release</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Featured Artist
            </Typography>
            <Box mt={2}>
              <IconLink href="#" target="_blank">
                <FaSpotify size={24} />
              </IconLink>
              <IconLink href="#" target="_blank">
                <SiBeatport size={24} />
              </IconLink>
              <IconLink href="#" target="_blank">
                <FaSoundcloud size={24} />
              </IconLink>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Playlists
        </Typography>
        <Grid container spacing={3}>
          {playlists.map((playlist) => (
            <Grid item xs={12} sm={6} key={playlist.id}>
              <PlaylistCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {playlist.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {playlist.description}
                  </Typography>
                  <Box mt={2}>
                    <IconLink href={playlist.url} target="_blank">
                      <FaSpotify size={24} />
                    </IconLink>
                  </Box>
                </CardContent>
              </PlaylistCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Typography variant="h5" gutterBottom>
        Artists
      </Typography>
      <Grid container spacing={3}>
        {deepArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} key={artist.id}>
            <ArtistCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {artist.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {artist.genres.join(', ')}
                </Typography>
                <Box mt={2}>
                  <IconLink href={artist.spotifyUrl} target="_blank">
                    <FaSpotify size={24} />
                  </IconLink>
                  <IconLink href={artist.beatportUrl} target="_blank">
                    <SiBeatport size={24} />
                  </IconLink>
                  <IconLink href={artist.soundcloudUrl} target="_blank">
                    <FaSoundcloud size={24} />
                  </IconLink>
                </Box>
              </CardContent>
            </ArtistCard>
          </Grid>
        ))}
      </Grid>
    </PageLayout>
  );
};

export default DeepPage;
