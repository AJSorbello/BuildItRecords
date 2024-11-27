import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Link, styled } from '@mui/material';
import { FaSpotify } from 'react-icons/fa';
import { labelColors } from '../theme/theme';
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
  spotifyUrl: string;
}

interface PlaylistPageProps {
  label: 'records' | 'tech' | 'deep';
}

const mockPlaylists: Record<string, Playlist[]> = {
  records: [
    {
      id: '1',
      title: 'House Essentials',
      description: 'The finest selection of underground house music',
      coverImage: 'https://via.placeholder.com/300x300?text=House+Essentials',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXa8NOEUWPn9W',
    },
    {
      id: '2',
      title: 'Deep House Vibes',
      description: 'Smooth and groovy deep house selections',
      coverImage: 'https://via.placeholder.com/300x300?text=Deep+House+Vibes',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
    {
      id: '3',
      title: 'Underground House',
      description: 'Raw and unfiltered house music from the underground',
      coverImage: 'https://via.placeholder.com/300x300?text=Underground+House',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8jqZp3XHOt3',
    },
  ],
  tech: [
    {
      id: '1',
      title: 'Techno Warehouse',
      description: 'Hard-hitting techno selections',
      coverImage: 'https://via.placeholder.com/300x300?text=Techno+Warehouse',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',
    },
    {
      id: '2',
      title: 'Industrial Techno',
      description: 'Dark and industrial techno cuts',
      coverImage: 'https://via.placeholder.com/300x300?text=Industrial+Techno',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1DWK5pyjPIb',
    },
  ],
  deep: [
    {
      id: '1',
      title: 'Deep House Sessions',
      description: 'Atmospheric deep house selections',
      coverImage: 'https://via.placeholder.com/300x300?text=Deep+House+Sessions',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
    {
      id: '2',
      title: 'Melodic Deep',
      description: 'Emotional and melodic deep house',
      coverImage: 'https://via.placeholder.com/300x300?text=Melodic+Deep',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
    },
  ],
};

const PlaylistPage: React.FC<PlaylistPageProps> = ({ label }) => {
  const color = labelColors[label];
  const playlists = mockPlaylists[label] || [];

  return (
    <PageLayout label={label}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 4, color }}>
          Playlists
        </Typography>

        <Grid container spacing={4}>
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
                  <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF' }}>
                    {playlist.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    {playlist.description}
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <IconLink href={playlist.spotifyUrl} target="_blank">
                      <FaSpotify size={24} />
                    </IconLink>
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
