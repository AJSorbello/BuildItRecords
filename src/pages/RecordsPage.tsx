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
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const PlaylistCard = styled(Card)({
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
  maxWidth: 800,
  margin: '0 auto',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const RecordsPage = () => {
  const recordsArtists = getArtistsByLabel('records');

  const playlists = [
    {
      id: '1',
      title: 'House Music Essentials',
      description: 'The best in underground house music',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',
    },
    {
      id: '2',
      title: 'Peak Time House',
      description: 'Hard-hitting peak time selections',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX5xiztvBdlUf',
    },
  ];

  const featuredReleases = [
    {
      id: '1',
      title: 'Latest House Release',
      artist: 'Featured Artist',
      catalogNumber: 'BIR001',
      genre: 'House',
      style: 'Deep House',
      releaseDate: '2022-01-01',
    },
    {
      id: '2',
      title: 'Another House Release',
      artist: 'Another Featured Artist',
      catalogNumber: 'BIR002',
      genre: 'House',
      style: 'Tech House',
      releaseDate: '2022-02-01',
    },
    {
      id: '3',
      title: 'One More House Release',
      artist: 'One More Featured Artist',
      catalogNumber: 'BIR003',
      genre: 'House',
      style: 'Acid House',
      releaseDate: '2022-03-01',
    },
  ];

  const latestRelease = featuredReleases[0]; // Get the most recent release
  const pastReleases = featuredReleases.slice(1); // Get all other releases

  return (
    <PageLayout label="records">
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
          Build It Records
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
          House Music for the Underground
        </Typography>

        {/* Featured Release */}
        <Box mb={8} sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 800 }}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Latest Release
            </Typography>
            <FeaturedReleaseCard>
              <CardMedia
                component="img"
                sx={{
                  height: 0,
                  paddingTop: '100%', // 1:1 aspect ratio
                  objectFit: 'cover'
                }}
                image={`https://via.placeholder.com/800x800.png?text=${encodeURIComponent(latestRelease.title)}`}
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
        </Box>

        {/* Past Releases */}
        <Box mb={4}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Past Releases
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {pastReleases.map((release) => (
              <Grid item xs={12} sm={6} md={3} key={release.id}>
                <ReleaseCard>
                  <CardMedia
                    component="img"
                    sx={{
                      height: 0,
                      paddingTop: '100%', // 1:1 aspect ratio
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

        {/* Playlists */}
        <Box mb={4}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Playlists
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {playlists.map((playlist) => (
              <Grid item xs={12} sm={6} key={playlist.id}>
                <PlaylistCard>
                  <CardContent sx={{ flexGrow: 1 }}>
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

        {/* Artists */}
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Artists
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {recordsArtists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} key={artist.id}>
              <ArtistCard>
                <CardContent sx={{ flexGrow: 1 }}>
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
      </Box>
    </PageLayout>
  );
};

export default RecordsPage;
