import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Button, Paper, Slider, IconButton, Avatar } from '@mui/material';
import { PlayArrow, Pause, SkipPrevious, SkipNext, VolumeUp, VolumeOff } from '@mui/icons-material';
import { getSpotifyIdFromUrl, getSpotifyUriFromId } from '../services/SpotifyAuthService';

interface SpotifyPlayerProps {
  token: string;
  trackUrl?: string;
  trackUri?: string;
  isPremium?: boolean;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    Spotify: {
      Player: any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Main SpotifyPlayer component that can handle both Premium and non-Premium users
export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ 
  token, 
  trackUrl, 
  trackUri, 
  isPremium = false,
  onError 
}) => {
  // If user is Premium, show the interactive player, otherwise show the embed
  return isPremium ? (
    <PremiumPlayer token={token} trackUrl={trackUrl} trackUri={trackUri} onError={onError} />
  ) : (
    <SpotifyEmbed trackUrl={trackUrl} trackUri={trackUri} />
  );
};

// Premium player component using Spotify Web Playback SDK
const PremiumPlayer: React.FC<SpotifyPlayerProps> = ({ token, trackUrl, trackUri, onError }) => {
  const [player, setPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [deviceId, setDeviceId] = useState('');
  const [volume, setVolume] = useState(50);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);
  
  const progressInterval = useRef<NodeJS.Timer | null>(null);

  // Load the Spotify Web Playback SDK
  useEffect(() => {
    if (!token) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new window.Spotify.Player({
        name: 'Build It Records Web Player',
        getOAuthToken: (cb: (token: string) => void) => { cb(token); },
        volume: volume / 100
      });

      setPlayer(newPlayer);

      // Error handling
      newPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Initialization error:', message);
        if (onError) onError(`Spotify Player initialization error: ${message}`);
      });

      newPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Authentication error:', message);
        if (onError) onError(`Spotify authentication error: ${message}`);
      });

      newPlayer.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Account error:', message);
        if (onError) onError('Premium Spotify account required for playback');
      });

      newPlayer.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Playback error:', message);
        if (onError) onError(`Playback error: ${message}`);
      });

      // Ready handling
      newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setLoading(false);
      });

      newPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      // Playback state handling
      newPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
        setPosition(state.position);
        setDuration(state.duration);
        setIsActive(true);

        // Update progress bar during playback
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }

        if (!state.paused) {
          progressInterval.current = setInterval(() => {
            setPosition(prev => {
              const newPosition = prev + 1000;
              return newPosition <= state.duration ? newPosition : state.duration;
            });
          }, 1000);
        }
      });

      newPlayer.connect();
    };

    // Clean up function
    return () => {
      if (player) {
        player.disconnect();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [token, onError, volume]);

  // Play track when trackUri or trackUrl changes
  useEffect(() => {
    const playTrack = async () => {
      if (!deviceId || !isReady) return;

      // Get the Spotify URI from URL if needed
      let uri = trackUri;
      if (!uri && trackUrl) {
        const trackId = getSpotifyIdFromUrl(trackUrl);
        if (trackId) {
          uri = getSpotifyUriFromId(trackId);
        }
      }

      if (!uri) {
        console.error('No valid track URI or URL provided');
        if (onError) onError('No valid track information provided');
        return;
      }

      try {
        console.log(`Playing track with URI: ${uri}`);
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [uri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error playing track:', error);
        if (onError) onError('Error starting playback');
      }
    };

    if (trackUri || trackUrl) {
      playTrack();
    }
  }, [deviceId, isReady, token, trackUri, trackUrl, onError]);

  // Control playback
  const togglePlay = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const previousTrack = () => {
    if (player) {
      player.previousTrack();
    }
  };

  const nextTrack = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    
    if (player) {
      player.setVolume(newVolume / 100);
    }
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    const newPosition = newValue as number;
    setPosition(newPosition);
    
    if (player) {
      player.seek(newPosition);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      if (player) {
        player.setVolume(previousVolume / 100);
      }
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      if (player) {
        player.setVolume(0);
      }
      setIsMuted(true);
    }
  };

  // Format time in MM:SS
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading Spotify Player...
        </Typography>
      </Box>
    );
  }

  if (!isReady) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body2" color="error">
          There was an issue connecting to Spotify. Please check your connection.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundImage: 'linear-gradient(to right, #1DB954, #191414)',
        color: 'white'
      }}
    >
      {currentTrack ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={currentTrack.album.images[0]?.url}
              variant="square"
              sx={{ width: 60, height: 60, borderRadius: 1 }}
            />
            <Box>
              <Typography variant="subtitle1" noWrap>
                {currentTrack.name}
              </Typography>
              <Typography variant="body2" noWrap>
                {currentTrack.artists.map((a: any) => a.name).join(', ')}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="caption">
              {formatTime(position)}
            </Typography>
            <Slider
              value={position}
              min={0}
              max={duration}
              onChange={handleProgressChange}
              sx={{ 
                color: 'white',
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0px 0px 0px 8px rgba(255, 255, 255, 0.16)'
                  }
                }
              }}
            />
            <Typography variant="caption">
              {formatTime(duration)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={previousTrack} size="small" sx={{ color: 'white' }}>
                <SkipPrevious />
              </IconButton>
              <IconButton 
                onClick={togglePlay} 
                size="medium" 
                sx={{ 
                  color: 'white', 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  mx: 1 
                }}
              >
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
              <IconButton onClick={nextTrack} size="small" sx={{ color: 'white' }}>
                <SkipNext />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', width: '30%' }}>
              <IconButton onClick={toggleMute} size="small" sx={{ color: 'white' }}>
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                value={volume}
                min={0}
                max={100}
                onChange={handleVolumeChange}
                size="small"
                sx={{ 
                  color: 'white',
                  ml: 1,
                  '& .MuiSlider-thumb': {
                    width: 8,
                    height: 8
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="body2">
            Ready to play. Click the play button on a track to start listening.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Simple Spotify Embed for non-Premium users
const SpotifyEmbed: React.FC<{ trackUrl?: string; trackUri?: string }> = ({ trackUrl, trackUri }) => {
  const [trackId, setTrackId] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract track ID from URL or URI
    if (trackUri?.startsWith('spotify:track:')) {
      setTrackId(trackUri.split(':')[2]);
    } else if (trackUrl) {
      const extractedId = getSpotifyIdFromUrl(trackUrl);
      if (extractedId) {
        setTrackId(extractedId);
      }
    }
  }, [trackUrl, trackUri]);
  
  if (!trackId) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Spotify track information not available.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <iframe 
        src={`https://open.spotify.com/embed/track/${trackId}`}
        width="100%" 
        height="80" 
        frameBorder="0" 
        allowTransparency={true} 
        allow="encrypted-media"
        style={{ borderRadius: '8px' }}
      />
    </Box>
  );
};

export default SpotifyPlayer;
