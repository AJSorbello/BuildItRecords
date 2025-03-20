import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * ErrorBoundary component for catching JavaScript errors
 * and displaying a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, info) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', info.componentStack);
  }

  resetErrorBoundary() {
    this.setState({
      hasError: false,
      error: null
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 3
        }}>
          <Paper elevation={3} sx={{
            padding: 4,
            maxWidth: 600,
            textAlign: 'center',
            backgroundColor: '#1e1e1e',
            border: '1px solid #444'
          }}>
            <Typography variant="h4" component="h1" gutterBottom color="error">
              Something went wrong
            </Typography>
            
            <Typography variant="body1" paragraph>
              The application encountered an unexpected error. We apologize for the inconvenience.
            </Typography>
            
            {this.state.error && (
              <Box sx={{ 
                backgroundColor: '#2d2d2d', 
                padding: 2, 
                borderRadius: 1,
                textAlign: 'left',
                marginBottom: 3,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <Typography variant="body2" component="pre" sx={{ color: '#ff6b6b', margin: 0 }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={this.resetErrorBoundary}
              sx={{ marginTop: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Export both ways for maximum compatibility
export { ErrorBoundary };
export default ErrorBoundary;
