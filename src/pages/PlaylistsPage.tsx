import * as React from 'react';
import { Box, Typography, Grid } from '@mui/material';

interface PlaylistsPageProps {
  label: 'records' | 'tech' | 'deep';
}

const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ label: _label }) => {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Playlists
      </Typography>

      <Grid container spacing={4}>
        {/* Add playlist cards here */}
      </Grid>
    </Box>
  );
};

export default PlaylistsPage;
