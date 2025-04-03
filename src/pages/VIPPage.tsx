import React from 'react';
import { Container } from '@mui/material';
import VIPSubscription from '../components/VIPSubscription';

const VIPPage: React.FC = () => {
  return (
    <Container maxWidth={false} disableGutters>
      <VIPSubscription />
    </Container>
  );
};

export default VIPPage;
