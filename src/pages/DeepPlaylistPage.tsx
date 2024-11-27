import React from 'react';
import { Box } from '@mui/material';
import PageLayout from '../components/PageLayout';
import DeepSidebar from '../components/DeepSidebar';
import { useSpotifyPlaylists } from '../hooks/useSpotifyPlaylists';

const DeepPlaylistPage: React.FC = () => {
  const { playlists, loading, error } = useSpotifyPlaylists('deep');

  return (
    <PageLayout label="deep">
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <DeepSidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: '#121212',
            color: '#FFFFFF',
            p: 3,
            overflow: 'auto'
          }}
        >
          {/* Content will be similar to PlaylistPage but with deep-specific playlists */}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default DeepPlaylistPage;
