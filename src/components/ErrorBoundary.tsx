import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: JSX.Element | JSX.Element[];
  fallback?: JSX.Element | JSX.Element[];
}

// A simple functional error boundary component using try/catch
const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Reset error state when children change
  useEffect(() => {
    setHasError(false);
    setError(null);
  }, [children]);

  // Use window error event to catch errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setHasError(true);
      setError(event.error || new Error('Unknown error occurred'));
      console.error('ErrorBoundary caught error:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const resetError = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError) {
    // Custom fallback UI
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback UI
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          margin: 2,
          borderRadius: 1,
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          color: '#343a40'
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {error && error.toString()}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={resetError}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // When there's no error, render children normally
  return <>{children}</>;
};

export default ErrorBoundary;
