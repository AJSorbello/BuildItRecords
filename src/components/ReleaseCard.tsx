import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Link,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { useTheme } from '../contexts/ThemeContext';
import { Track } from '../types/track';
import { Release } from '../types/release';

interface ReleaseCardProps {
  release?: Release;
  track?: Track;
  compact?: boolean;
  featured?: boolean;
  ranking?: number;
  onPlay?: (track: Track) => void;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, track, compact = false, featured = false, ranking, onPlay }) => {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = async (track: Track) => {
    if (!track.previewUrl) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(track.previewUrl);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      });
      
      audio.play();
      setIsPlaying(true);
      setCurrentTrack(track);
    }
  };

  const handlePlayClick = () => {
    if (onPlay && track?.previewUrl) {
      onPlay(track);
    }
  };

  const getTitle = () => {
    if (track) return track.trackTitle;
    if (release) return release.title;
    return '';
  };

  const getArtist = () => {
    if (track) return track.artist;
    if (release) return release.artist;
    return '';
  };

  const getArtwork = () => {
    if (track) return track.albumCover || track.album?.images[0]?.url;
    if (release) return release.artwork;
    return '';
  };

  const getSpotifyUrl = () => {
    if (track) return track.spotifyUrl;
    if (release) return release.spotifyUrl;
    return '';
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '400px',
        maxHeight: '400px',
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        ...(featured && {
          '& .MuiCardMedia-root': {
            height: '400px',
          },
        }),
      }}
    >
      {ranking && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            fontWeight: 'bold',
          }}
        >
          #{ranking}
        </Box>
      )}
      <CardMedia
        component="img"
        image={getArtwork() || `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(getTitle())}`}
        alt={getTitle()}
        sx={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
        }}
      />
      
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography 
            variant={featured ? 'h5' : 'h6'} 
            component="h2" 
            sx={{ 
              mb: 1, 
              color: colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2
            }}
          >
            {getTitle()}
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary" 
            sx={{ 
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {getArtist()}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 2 }}
          >
            {new Date(track?.releaseDate || release?.releaseDate || '').toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        </Box>
        
        {!compact && (
          <Box sx={{ mt: 2 }}>
            {release?.tracks?.map((track) => (
              <Box
                key={track.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handlePlayPause(track)}
                  disabled={!track.previewUrl}
                  sx={{ mr: 1 }}
                >
                  {isPlaying && currentTrack?.id === track.id ? (
                    <PauseIcon />
                  ) : (
                    <PlayArrowIcon />
                  )}
                </IconButton>
                <Typography variant="body2" sx={{ color: colors.text }}>
                  {track.trackTitle}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {getSpotifyUrl() && (
            <IconButton
              component={Link}
              href={getSpotifyUrl()}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#1DB954' }}
            >
              <MusicNoteIcon sx={{ fontSize: 24 }} />
            </IconButton>
          )}
          {release?.beatportUrl && (
            <IconButton
              component={Link}
              href={release.beatportUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#FF6B00' }}
            >
              <AlbumIcon />
            </IconButton>
          )}
          {release?.soundcloudUrl && (
            <IconButton
              component={Link}
              href={release.soundcloudUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#FF7700' }}
            >
              <CloudQueueIcon />
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

interface TrackCardProps {
  track: Track;
  onPlay?: (track: Track) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onPlay }) => {
  const handlePlayClick = () => {
    if (onPlay && track.previewUrl) {
      onPlay(track);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
        <CardMedia
          component="img"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          image={track.albumCover || track.album?.images[0]?.url || `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(track.trackTitle)}`}
          alt={track.trackTitle}
        />
      </Box>
      <CardContent>
        <Typography variant="h6" component="div" sx={{ color: '#FFFFFF', mb: 1 }}>
          {track.trackTitle}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#AAAAAA', mb: 2 }}>
          {track.artist}
        </Typography>
        {track.album && (
          <Typography variant="body2" sx={{ color: '#888888', mb: 1 }}>
            {track.album.name}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          {track.previewUrl && (
            <IconButton
              onClick={handlePlayClick}
              sx={{ color: '#FFFFFF', mr: 1 }}
            >
              <PlayArrowIcon />
            </IconButton>
          )}
          {track.spotifyUrl && (
            <Link
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#1DB954',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  color: '#1ed760',
                },
              }}
            >
              <MusicNoteIcon sx={{ fontSize: 24 }} />
            </Link>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReleaseCard;
