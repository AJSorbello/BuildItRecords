import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Grid,
  CircularProgress,
} from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import SpotifyClient from '../services/SpotifyClient';

const SpotifyTrackList = ({ searchQuery }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!searchQuery) return;
      
      setLoading(true);
      try {
        const results = await SpotifyClient.searchTracks(searchQuery);
        setTracks(results);
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [searchQuery]);

  const handlePlayPause = (track) => {
    if (playingTrack?.id === track.id) {
      audio?.pause();
      setPlayingTrack(null);
      setAudio(null);
    } else {
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(track.preview_url);
      newAudio.play();
      setPlayingTrack(track);
      setAudio(newAudio);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {tracks.map((track) => (
        <Grid item xs={12} sm={6} md={4} key={track.id}>
          <Card sx={{ display: 'flex', height: '100%' }}>
            <CardMedia
              component="img"
              sx={{ width: 151 }}
              image={track.album.images[0]?.url}
              alt={track.album.name}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography component="div" variant="h6" noWrap>
                  {track.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" component="div" noWrap>
                  {track.artists.map(artist => artist.name).join(', ')}
                </Typography>
              </CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
                {track.preview_url && (
                  <IconButton onClick={() => handlePlayPause(track)}>
                    {playingTrack?.id === track.id ? <Pause /> : <PlayArrow />}
                  </IconButton>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SpotifyTrackList;
