import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Track } from '../types/track';
import { spotifyService } from '../services/SpotifyService';

interface TrackListProps {
  tracks: Track[];
  onPlayTrack?: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onPlayTrack }) => {
  const [trackDetails, setTrackDetails] = useState<Record<string, Track>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAllTrackDetails = async () => {
      for (const track of tracks) {
        if (!trackDetails[track.id] && !loading[track.id]) {
          setLoading(prev => ({ ...prev, [track.id]: true }));
          try {
            const details = await spotifyService.getTrackDetailsByUrl(track.spotifyUrl);
            if (details) {
              setTrackDetails(prev => ({ ...prev, [track.id]: details }));
            }
          } catch (error) {
            console.error(`Error fetching details for track ${track.id}:`, error);
          } finally {
            setLoading(prev => ({ ...prev, [track.id]: false }));
          }
        }
      }
    };

    fetchAllTrackDetails();
  }, [tracks]);

  return (
    <Box>
      {tracks.map((track) => (
        <Box
          key={track.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {onPlayTrack && track.previewUrl && (
            <IconButton
              onClick={() => onPlayTrack(track)}
              sx={{ marginRight: 2 }}
            >
              <PlayArrowIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="subtitle1">{track.trackTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              {track.artist}
            </Typography>
          </Box>
          {loading[track.id] && (
            <CircularProgress size={20} sx={{ marginLeft: 'auto' }} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TrackList;
