import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';

const Home = () => {
  const [tracks, setTracks] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await axios.get('/api/track-management/tracks');
      setTracks(response.data.tracks || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tracks');
      setLoading(false);
    }
  };

  const handleCategoryChange = (event, newValue) => {
    setCategory(newValue);
  };

  const filteredTracks = category === 'all' 
    ? tracks 
    : tracks.filter(track => track.category === category);

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={category} 
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          <Tab label="Featured" value="Featured" />
          <Tab label="New Release" value="New Release" />
          <Tab label="Popular" value="Popular" />
          <Tab label="Recommended" value="Recommended" />
        </Tabs>
      </Box>

      <Grid container spacing={4}>
        {filteredTracks.map((track) => (
          <Grid item key={track.id} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardMedia
                component="img"
                sx={{
                  height: 250,
                  objectFit: 'cover',
                }}
                image={track.albumArt || 'https://via.placeholder.com/300'}
                alt={track.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {track.name}
                </Typography>
                <Typography>
                  {track.artist}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {track.album}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="primary"
                  sx={{ 
                    display: 'inline-block',
                    mt: 1,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {track.category}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;
