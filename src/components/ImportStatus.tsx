import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import { ImportProgress } from '../types';

interface ImportStatusProps {
  label: string;
  onImportComplete?: () => void;
}

export const ImportStatus: React.FC<ImportStatusProps> = ({ label, onImportComplete }) => {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/import/status?label=${label}`);
        if (!response.ok) throw new Error('Failed to fetch import status');
        
        const data = await response.json();
        setProgress(data);
        
        if (data.current === data.total) {
          clearInterval(interval);
          if (onImportComplete) onImportComplete();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check import status');
        clearInterval(interval);
      }
    };

    if (label) {
      checkProgress();
      interval = setInterval(checkProgress, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [label, onImportComplete]);

  if (!progress) return null;

  const percentage = Math.round((progress.current / progress.total) * 100);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Importing tracks: {progress.current} / {progress.total}
      </Typography>
      
      <LinearProgress 
        variant="determinate" 
        value={percentage}
        sx={{ mb: 1 }}
      />
      
      <Typography variant="body2" color="text.secondary">
        {progress.succeeded} succeeded, {progress.failed} failed
      </Typography>
      
      {progress.errors.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="error">
            Errors:
          </Typography>
          {progress.errors.map((error, index) => (
            <Typography key={index} variant="body2" color="error" sx={{ ml: 2 }}>
              • {error}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};
