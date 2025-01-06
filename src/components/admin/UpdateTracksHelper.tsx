import React from 'react';
import { Button } from '@mui/material';
import { Track } from '../../types/track';
import { RECORD_LABELS } from '../../config';
import { RecordLabel } from '../../constants/labels';

interface UpdateTracksHelperProps {
  tracks: Track[];
  onUpdate: (tracks: Track[]) => void;
}

export const UpdateTracksHelper: React.FC<UpdateTracksHelperProps> = ({ tracks, onUpdate }) => {
  const handleUpdateTracks = async () => {
    try {
      const updatedTracks = tracks.map(track => {
        if (track.spotifyUrl && (!track.label || track.label.id !== 'buildit-deep')) {
          return {
            ...track,
            label: RECORD_LABELS['buildit-deep']
          };
        }
        return track;
      });

      onUpdate(updatedTracks);
    } catch (error) {
      console.error('Error updating tracks:', error);
    }
  };

  return (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleUpdateTracks}
      disabled={tracks.length === 0}
    >
      Move to Deep ({tracks.length})
    </Button>
  );
};
