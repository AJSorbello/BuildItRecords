import React from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { label = 'records' } = useParams<{ label?: string }>();

  const labelColors = {
    records: '#02FF95',
    tech: '#FF0000',
    deep: '#00BFFF'
  };

  const color = labelColors[label as keyof typeof labelColors] || labelColors.records;

  return (
    <Container>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#FFFFFF',
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '8rem',
            fontWeight: 'bold',
            color: color,
            mb: 2
          }}
        >
          404
        </Typography>
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: '#FFFFFF'
          }}
        >
          Page Not Found
        </Typography>
        <Typography
          variant="h6"
          gutterBottom
        >
          Looks like you&apos;ve wandered into uncharted territory
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(`/${label}`)}
          sx={{
            bgcolor: color,
            color: '#121212',
            '&:hover': {
              bgcolor: color,
              opacity: 0.9,
            },
          }}
        >
          Return Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
