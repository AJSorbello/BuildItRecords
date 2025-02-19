import React, { useState } from 'react';
import { Box, Button, LinearProgress, Typography, Alert } from '@mui/material';
import { databaseService } from '../services/DatabaseService';

interface ImportStatusProps {
  labelId: string;
  onImportComplete?: () => void;
}

export const ImportStatus: React.FC<ImportStatusProps> = ({ labelId, onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleImport = async () => {
    try {
      setImporting(true);
      setError(null);
      setProgress(0);

      // Simulate import progress
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 10;
          if (next >= 100) {
            clearInterval(interval);
          }
          return next > 100 ? 100 : next;
        });
      }, 500);

      // Call your import function here
      // await databaseService.importData(labelId);

      clearInterval(interval);
      setProgress(100);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Import Status</Typography>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={importing}
          sx={{ backgroundColor: '#1DB954', '&:hover': { backgroundColor: '#1ed760' } }}
        >
          {importing ? 'Importing...' : 'Import Data'}
        </Button>
      </Box>

      {importing && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#2a2a2a',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#1DB954'
              }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {progress}% Complete
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ImportStatus;
