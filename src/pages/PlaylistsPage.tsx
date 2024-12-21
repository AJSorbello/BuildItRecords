import * as React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled } from '@mui/material';
import { FaSpotify } from 'react-icons/fa';
import { RecordLabel, RECORD_LABELS, labelIdToKey } from '../constants/labels';

interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: any[];
}

interface PlaylistsPageProps {
  label: string;
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

const getPlaylists = (label: RecordLabel): Playlist[] => {
  switch (label) {
    case RECORD_LABELS['Build It Tech']:
      return [
        {
          id: '1',
          name: 'Tech House Essentials',
          description: 'The best in tech house music',
          tracks: []
        },
        {
          id: '2',
          name: 'Tech House Classics',
          description: 'Timeless tech house tracks',
          tracks: []
        }
      ];
    case RECORD_LABELS['Build It Deep']:
      return [
        {
          id: '1',
          name: 'Deep House Essentials',
          description: 'The best in deep house music',
          tracks: []
        },
        {
          id: '2',
          name: 'Deep House Classics',
          description: 'Timeless deep house tracks',
          tracks: []
        }
      ];
    case RECORD_LABELS['Build It Records']:
    default:
      return [
        {
          id: '1',
          name: 'House Music Essentials',
          description: 'The best in house music',
          tracks: []
        }
      ];
  }
};

const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ label }) => {
  const recordLabel = labelIdToKey[label as keyof typeof labelIdToKey];
  const playlists = getPlaylists(recordLabel);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
        {recordLabel === RECORD_LABELS['Build It Tech'] ? 'Build It Tech' : recordLabel === RECORD_LABELS['Build It Deep'] ? 'Build It Deep' : 'Build It Records'}
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
        {recordLabel === RECORD_LABELS['Build It Tech'] ? 'Techno & Tech House' : recordLabel === RECORD_LABELS['Build It Deep'] ? 'Deep House' : 'House Music'} Playlists
      </Typography>

      <Grid container spacing={4}>
        {playlists.map((playlist) => (
          <Grid item xs={12} sm={6} md={4} key={playlist.id}>
            <PlaylistCard>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ color: 'text.primary', mb: 1 }}>
                  {playlist.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '40px' }}>
                  {playlist.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {playlist.tracks.length} tracks
                  </Typography>
                </Box>
                <SpotifyLink href="#" target="_blank">
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
