import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardMedia, Link, IconButton, styled } from '@mui/material';
import { FaSpotify, FaPlay, FaPause } from 'react-icons/fa';
import { spotifyService } from '../services/SpotifyService';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumCover: string;
  previewUrl: string | null;
  spotifyUrl: string;
  duration: string;
}

const TrackCard = styled(Card)({
  display: 'flex',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: 'scale(1.02)',
    '& .play-button': {
      opacity: 1,
    },
  },
});

const PlayButton = styled(IconButton)({
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  color: '#1DB954',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  padding: '6px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});

const SpotifyButton = styled(Link)({
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  width: 'fit-content',
  textDecoration: 'none',
  '&:hover': {
    color: '#1DB954',
  },
});

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

interface PlaylistTrackListProps {
  playlistId?: string;
}

const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ playlistId }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlistId) return;

      try {
        const response = await spotifyService.getPlaylist(playlistId);
        if (!response) {
          throw new Error('Failed to fetch playlist');
        }
        
        const formattedTracks = response.tracks.items.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map((artist: any) => artist.name).join(', '),
          album: item.track.album.name,
          albumCover: item.track.album.images[0]?.url || '',
          previewUrl: item.track.preview_url,
          spotifyUrl: item.track.external_urls.spotify,
          duration: formatDuration(item.track.duration_ms),
        }));

        setTracks(formattedTracks);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tracks:', error);
      }
    };

    fetchTracks();
  }, [playlistId]);

  const handlePlay = (track: Track) => {
    if (audioElement) {
      audioElement.pause();
      if (playingTrackId === track.id) {
        setPlayingTrackId(null);
        setAudioElement(null);
        return;
      }
    }

    if (track.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audio.play();
      audio.addEventListener('ended', () => {
        setPlayingTrackId(null);
        setAudioElement(null);
      });
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {tracks.map((track) => (
          <Grid item xs={12} key={track.id}>
            <TrackCard>
              <CardMedia
                component="img"
                sx={{ width: 60, height: 60 }}
                image={track.albumCover}
                alt={`${track.name} cover`}
              />
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', px: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" component="div" sx={{ color: 'text.primary' }}>
                    {track.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {track.artist}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {track.previewUrl && (
                    <PlayButton
                      className="play-button"
                      size="small"
                      onClick={() => handlePlay(track)}
                    >
                      {playingTrackId === track.id ? <FaPause /> : <FaPlay />}
                    </PlayButton>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45 }}>
                    {track.duration}
                  </Typography>
                  <SpotifyButton
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <FaSpotify size={20} />
                  </SpotifyButton>
                </Box>
              </Box>
            </TrackCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PlaylistTrackList;
