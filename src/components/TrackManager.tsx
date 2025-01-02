import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { API_URL } from '../config';

interface Track {
  id: string;
  name: string;
  album_id: string;
  artist_id: string;
  artist_name: string;
  album_title: string;
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

interface TrackManagerProps {
  selectedLabel: string;
}

const TrackManager: React.FC<TrackManagerProps> = ({ selectedLabel }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedLabel) {
      fetchTracks();
    }
  }, [selectedLabel]);

  useEffect(() => {
    // Cleanup audio on component unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const fetchTracks = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching tracks for label:', selectedLabel);
      const response = await fetch(`${API_URL}/tracks/${selectedLabel}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracks');
      }

      console.log('Fetched tracks:', data);
      setTracks(data.data || []);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = (track: Track) => {
    if (!track.preview_url) {
      console.log('No preview URL available for this track');
      return;
    }

    if (playingTrackId === track.id) {
      // Stop current track
      if (audioElement) {
        audioElement.pause();
        setPlayingTrackId(null);
      }
    } else {
      // Stop current track if any
      if (audioElement) {
        audioElement.pause();
      }

      // Play new track
      const audio = new Audio(track.preview_url);
      audio.addEventListener('ended', () => setPlayingTrackId(null));
      audio.play();
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Play</TableCell>
            <TableCell>Track Name</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell>Album</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Preview</TableCell>
            <TableCell>Spotify</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell>
                <IconButton
                  onClick={() => handlePlayPause(track)}
                  disabled={!track.preview_url}
                >
                  {playingTrackId === track.id ? (
                    <PauseIcon />
                  ) : (
                    <PlayArrowIcon />
                  )}
                </IconButton>
              </TableCell>
              <TableCell>{track.name}</TableCell>
              <TableCell>{track.artist_name}</TableCell>
              <TableCell>{track.album_title}</TableCell>
              <TableCell>{formatDuration(track.duration_ms)}</TableCell>
              <TableCell>
                {track.preview_url ? 'Available' : 'Not available'}
              </TableCell>
              <TableCell>
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Spotify
                </a>
              </TableCell>
            </TableRow>
          ))}
          {tracks.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body1" color="textSecondary">
                  No tracks found. Try importing some releases first.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrackManager;
