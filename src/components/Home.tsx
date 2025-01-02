import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { API_URL } from '../config'; // assuming config file is in the parent directory

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  category: string;
}

const Home: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{ tracks: Track[] }>(`${API_URL}/track-management/tracks`);
      setTracks(response.data.tracks || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tracks');
      setLoading(false);
    }
  };

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setCategory(newValue);
  };

  const filteredTracks = category === 'all' 
    ? tracks 
    : tracks.filter(track => track.category === category);

  if (loading) {
    return (
      <Typography>Loading...</Typography>
    );
  }

  if (error) {
    return (
      <Typography color="error">{error}</Typography>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={category} 
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#02FF95',
            },
            '& .MuiTab-root': {
              color: '#FFFFFF',
              '&.Mui-selected': {
                color: '#02FF95',
              },
            },
          }}
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
                backgroundColor: '#282828',
                '&:hover': {
                  transform: 'scale(1.02)',
                  backgroundColor: '#383838',
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
                <Typography gutterBottom variant="h6" component="h2" sx={{ color: '#FFFFFF' }}>
                  {track.name}
                </Typography>
                <Typography sx={{ color: '#B3B3B3' }}>
                  {track.artist}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
                  {track.album}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'inline-block',
                    mt: 1,
                    backgroundColor: '#02FF95',
                    color: '#121212',
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
    </Box>
  );
};

export default Home;
