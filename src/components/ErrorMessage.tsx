import React from 'react';
import { Alert, Box } from '@mui/material';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <Box mt={2} mb={2}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
};

export default ErrorMessage;
