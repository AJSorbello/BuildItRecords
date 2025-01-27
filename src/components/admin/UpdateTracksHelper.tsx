import React from 'react';
import { Button } from '@mui/material';
import { Track } from '../../types/models';
import { RECORD_LABELS, RecordLabelId } from '../../types/labels';

interface UpdateTracksHelperProps {
  tracks: Track[];
  onUpdate: (tracks: Track[]) => void;
}

export const UpdateTracksHelper: React.FC<UpdateTracksHelperProps> = ({ tracks, onUpdate }) => {
  const handleUpdateTracks = async () => {
    try {
      const updatedTracks = tracks.map(track => {
        if (track.external_urls.spotify && (!track.label_id || track.label_id !== RECORD_LABELS.DEEP)) {
          return {
            ...track,
            label_id: RECORD_LABELS.DEEP
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
