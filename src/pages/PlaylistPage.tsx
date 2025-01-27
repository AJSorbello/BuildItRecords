import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Link, styled, Container } from '@mui/material';
import { FaSpotify } from 'react-icons/fa';
import { labelColors } from '../theme/theme';
import PageLayout from '../components/PageLayout';
import PlayableTrackList from '../components/common/PlayableTrackList';

const PlaylistCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.3s ease-in-out',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    '& .spotify-icon': {
      color: '#1DB954',
    }
  },
});

const IconLink = styled(Link)({
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

interface Playlist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  spotifyUrl: string;
  followers?: number;
  tracks?: number;
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
      followers: 5000,
      tracks: 100,
    },
    {
      id: '2',
      title: 'Deep House Vibes',
      description: 'Smooth and groovy deep house selections',
      coverImage: 'https://via.placeholder.com/300x300?text=Deep+House+Vibes',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2TRYkJECvfC',
      followers: 3500,
      tracks: 75,
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
      followers: 4200,
      tracks: 80,
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
      followers: 3800,
      tracks: 90,
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
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const playlists = mockPlaylists[label] || [];
  const labelColor = labelColors[label];

  return (
    <PageLayout label={label}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
          {label === 'tech' ? 'Build It Tech' : label === 'deep' ? 'Build It Deep' : 'Build It Records'}
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
          {label === 'tech' ? 'Techno & Tech House' : label === 'deep' ? 'Deep House' : 'House Music'} Playlists
        </Typography>

        <Grid container spacing={4}>
          {/* Playlists Grid */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Playlists
            </Typography>
            <Grid container spacing={2}>
              {playlists.map((playlist) => (
                <Grid item xs={12} key={playlist.id}>
                  <PlaylistCard 
                    onClick={() => setSelectedPlaylist(playlist)}
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedPlaylist?.id === playlist.id ? `2px solid ${labelColor}` : 'none'
                    }}
                  >
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
                      <IconLink href={playlist.spotifyUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
                        <FaSpotify size={20} className="spotify-icon" />
                        <Typography variant="body2">Play on Spotify</Typography>
                      </IconLink>
                    </CardContent>
                  </PlaylistCard>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Track List */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {selectedPlaylist ? selectedPlaylist.title : 'Select a Playlist'}
            </Typography>
            {selectedPlaylist ? (
              <PlayableTrackList playlistId={selectedPlaylist.id} />
            ) : (
              <Box 
                sx={{ 
                  height: '400px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Select a playlist to view tracks
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </PageLayout>
  );
};

export default PlaylistPage;
