import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { spotifyService } from '../../services/SpotifyService';
import { RecordLabelId } from '../../types/labels';
import { useAuth } from '../../hooks/useAuth';

interface ImportTracksProps {
  labelId: RecordLabelId;
  onImportComplete?: () => void;
}

const ImportTracks: React.FC<ImportTracksProps> = ({ labelId, onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        if (!token) return;
        
        const status = await spotifyService.checkImportStatus(labelId, token);
        setProgress(status.progress);
        
        if (status.status === 'completed') {
          setIsImporting(false);
          clearInterval(intervalId);
          setSuccess('Import completed successfully!');
          onImportComplete?.();
        }
      } catch (error) {
        console.error('Error checking import status:', error);
        setError('Failed to check import status');
        setIsImporting(false);
        clearInterval(intervalId);
      }
    };

    if (isImporting) {
      intervalId = setInterval(checkStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isImporting, labelId, token, onImportComplete]);

  const handleImport = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setSuccess(null);
      setProgress(0);

      const result = await spotifyService.importTracksFromSpotify(labelId, token);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Success message will be set when import is complete
    } catch (error) {
      console.error('Error importing tracks:', error);
      setError(error instanceof Error ? error.message : 'Failed to import tracks');
      setIsImporting(false);
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 3,
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF'
      }}
    >
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="h6">Import Tracks from Spotify</Typography>
        
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{
              '& .MuiAlert-message': {
                color: '#000000'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            onClose={() => setSuccess(null)}
            sx={{
              '& .MuiAlert-message': {
                color: '#000000'
              }
            }}
          >
            {success}
          </Alert>
        )}

        {isImporting && (
          <Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                mb: 1,
                backgroundColor: 'rgba(2, 255, 149, 0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#02FF95'
                }
              }}
            />
            <Typography variant="body2" color="textSecondary">
              Importing tracks... {progress}%
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleImport}
          disabled={isImporting}
          sx={{
            backgroundColor: '#02FF95',
            color: '#000000',
            '&:hover': {
              backgroundColor: '#00CC76'
            },
            '&:disabled': {
              backgroundColor: 'rgba(2, 255, 149, 0.5)'
            }
          }}
        >
          {isImporting ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Importing...
            </Box>
          ) : (
            'Import Tracks'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default ImportTracks;
