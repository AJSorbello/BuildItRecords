import React from 'react';
import { CircularProgress, Box } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40,
  color = 'primary'
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minHeight: '200px'
      }}
    >
      <CircularProgress 
        size={size}
        color={color}
        sx={{
          color: theme => color === 'primary' ? theme.palette.primary.main : undefined
        }}
      />
    </Box>
  );
};
