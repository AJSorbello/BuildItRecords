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

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
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

  return (
    <PageLayout label="records">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
          Build It Records
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
          House Music for the Underground
        </Typography>

        <Typography variant="h5" gutterBottom>
          Featured Releases
        </Typography>
        <Grid container spacing={3}>
          {featuredReleases.map((release) => (
            <Grid item xs={12} sm={6} md={4} key={release.id}>
              <ReleaseCard>
                <CardMedia
                  component="img"
                  height="200"
                  image={`https://via.placeholder.com/300x300.png?text=${encodeURIComponent(release.title)}`}
                  alt={release.title}
                />
                <CardContent>
                  <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
                    {release.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {release.artist}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {release.catalogNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {release.genre} {release.style ? `- ${release.style}` : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </ReleaseCard>
            </Grid>
          ))}
        </Grid>
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
        {recordsArtists.map((artist) => (
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

export default RecordsPage;
