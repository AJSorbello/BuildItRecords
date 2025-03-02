import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingSpinner: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <CircularProgress size={60} thickness={4} />
      <Typography 
        variant="body1" 
        sx={{ mt: 2, opacity: 0.7 }}
      >
        Loading...
      </Typography>
    </Box>
  );
};
