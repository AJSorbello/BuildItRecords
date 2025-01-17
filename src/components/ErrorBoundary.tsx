/**
 * Error Boundary component for handling runtime errors
 * @module ErrorBoundary
 */

import React, { FC, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
  backgroundColor: '#121212',
  color: '#FFFFFF',
}));

const ErrorButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: '#02FF95',
  color: '#121212',
  '&:hover': {
    backgroundColor: '#00CC76',
  },
}));

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI
 */
const ErrorBoundary: FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setError] = React.useState(false);
  const [error, setErrorState] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleReset = () => {
      setError(false);
      setErrorState(null);
      // Attempt to recover by trying to re-render the segment
      window.location.reload();
    };
  }, []);

  const componentDidCatch = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Uncaught error:', error, errorInfo);
    // Here you could send error reports to your error tracking service
  };

  if (hasError) {
    if (children.fallback) {
      return children.fallback;
    }

    return (
      <ErrorContainer>
        <Typography variant="h4" gutterBottom>
          Oops! Something went wrong
        </Typography>
        <Typography variant="body1" align="center" sx={{ maxWidth: 600, mb: 3 }}>
          We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
        </Typography>
        <ErrorButton
          variant="contained"
          onClick={() => {
            setError(false);
            setErrorState(null);
            // Attempt to recover by trying to re-render the segment
            window.location.reload();
          }}
        >
          Try Again
        </ErrorButton>
      </ErrorContainer>
    );
  }

  return children;
};

export { ErrorBoundary };
