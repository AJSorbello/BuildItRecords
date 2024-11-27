import React from 'react';
import { Box } from '@mui/material';
import PageLayout from '../components/PageLayout';
import TechSidebar from '../components/TechSidebar';
import { useSpotifyPlaylists } from '../hooks/useSpotifyPlaylists';

const TechPlaylistPage: React.FC = () => {
  const { playlists, loading, error } = useSpotifyPlaylists('tech');

  return (
    <PageLayout label="tech">
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <TechSidebar />
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
          {/* Content will be similar to PlaylistPage but with tech-specific playlists */}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default TechPlaylistPage;
