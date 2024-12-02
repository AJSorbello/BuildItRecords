import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled } from '@mui/material';
import { FaSpotify } from 'react-icons/fa';
import { LabelKey } from '../types/labels';

interface Playlist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  spotifyUrl: string;
  followers?: number;
  tracks?: number;
}

interface PlaylistsPageProps {
  label: LabelKey;
}

const PlaylistCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    '& .spotify-icon': {
      color: '#1DB954',
    }
  },
});

const SpotifyLink = styled(Link)({
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  transition: 'color 0.2s ease-in-out',
  '&:hover': {
    color: '#1DB954',
  },
});

const getPlaylists = (label: LabelKey): Playlist[] => {
  switch (label) {
    case 'TECH':
      return [
        {
          id: '1',
          title: 'Build It Tech Weekly',
          description: 'Fresh techno and tech house tracks curated weekly. The best in underground electronic music.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 1500,
          tracks: 50,
        },
        {
          id: '2',
          title: 'Tech House Essentials',
          description: 'Essential tech house tracks that defined the genre. Updated monthly.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 2500,
          tracks: 100,
        },
        {
          id: '3',
          title: 'Underground Techno',
          description: 'Deep, dark, and driving techno tracks from the underground scene.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 3500,
          tracks: 75,
        },
      ];
    case 'DEEP':
      return [
        {
          id: '1',
          title: 'Deep House Meditation',
          description: 'Smooth and melodic deep house tracks for your soul.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 2000,
          tracks: 80,
        },
        {
          id: '2',
          title: 'Deep & Atmospheric',
          description: 'Atmospheric deep house cuts perfect for late night sessions.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 1800,
          tracks: 60,
        },
      ];
    default:
      return [
        {
          id: '1',
          title: 'Build It Records Radio',
          description: 'The sound of Build It Records. Updated weekly with fresh house music.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 5000,
          tracks: 100,
        },
        {
          id: '2',
          title: 'House Classics',
          description: 'Timeless house music classics that shaped the genre.',
          coverImage: 'https://via.placeholder.com/300',
          spotifyUrl: 'https://open.spotify.com/playlist/yourid',
          followers: 3500,
          tracks: 150,
        },
      ];
  }
};

const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ label }) => {
  const playlists = getPlaylists(label);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
        {label === 'TECH' ? 'Build It Tech' : label === 'DEEP' ? 'Build It Deep' : 'Build It Records'}
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
        {label === 'TECH' ? 'Techno & Tech House' : label === 'DEEP' ? 'Deep House' : 'House Music'} Playlists
      </Typography>

      <Grid container spacing={4}>
        {playlists.map((playlist) => (
          <Grid item xs={12} sm={6} md={4} key={playlist.id}>
            <PlaylistCard>
              <CardMedia
                component="img"
                sx={{
                  height: 0,
                  paddingTop: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.9)',
                }}
                image={playlist.coverImage}
                alt={playlist.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ color: 'text.primary', mb: 1 }}>
                  {playlist.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '40px' }}>
                  {playlist.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {playlist.followers?.toLocaleString()} followers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {playlist.tracks} tracks
                  </Typography>
                </Box>
                <SpotifyLink href={playlist.spotifyUrl} target="_blank">
                  <FaSpotify size={20} className="spotify-icon" />
                  <Typography variant="body2">Play on Spotify</Typography>
                </SpotifyLink>
              </CardContent>
            </PlaylistCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PlaylistsPage;
