import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Link, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import PageLayout from '../components/PageLayout';

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

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

interface Playlist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
}

interface PlaylistPageProps {
  label: 'records' | 'tech' | 'deep';
}

const PlaylistPage: React.FC<PlaylistPageProps> = ({ label }) => {
  // Mock data - replace with actual data from your backend
  const playlists: Playlist[] = [
    {
      id: '1',
      title: `Build It ${label.charAt(0).toUpperCase() + label.slice(1)} Essential Mix`,
      description: 'Latest tracks and classic selections',
      coverImage: 'https://via.placeholder.com/300x300.png?text=Essential+Mix',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
    {
      id: '2',
      title: `${label.charAt(0).toUpperCase() + label.slice(1)} House Selections`,
      description: 'Current favorites and upcoming releases',
      coverImage: 'https://via.placeholder.com/300x300.png?text=House+Selections',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
    {
      id: '3',
      title: 'Artist Spotlight',
      description: 'Featured artist selections',
      coverImage: 'https://via.placeholder.com/300x300.png?text=Artist+Spotlight',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
    // Add more playlists as needed
  ];

  return (
    <PageLayout label={label}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
          Playlists
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
          {label.charAt(0).toUpperCase() + label.slice(1)} House Selections
        </Typography>

        <Grid container spacing={3}>
          {playlists.map((playlist) => (
            <Grid item xs={12} sm={6} md={4} key={playlist.id}>
              <PlaylistCard>
                <CardMedia
                  component="img"
                  height="300"
                  image={playlist.coverImage}
                  alt={playlist.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {playlist.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {playlist.description}
                  </Typography>
                  <Box mt={2}>
                    {playlist.spotifyUrl && (
                      <IconLink href={playlist.spotifyUrl} target="_blank">
                        <FaSpotify size={24} />
                      </IconLink>
                    )}
                    {playlist.soundcloudUrl && (
                      <IconLink href={playlist.soundcloudUrl} target="_blank">
                        <FaSoundcloud size={24} />
                      </IconLink>
                    )}
                  </Box>
                </CardContent>
              </PlaylistCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default PlaylistPage;
