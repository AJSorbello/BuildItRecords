/**
 * Error Boundary component for handling runtime errors
 * @module ErrorBoundary
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

interface Props {
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
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here you could send error reports to your error tracking service
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Attempt to recover by trying to re-render the segment
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
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
            onClick={this.handleReset}
          >
            Try Again
          </ErrorButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}
