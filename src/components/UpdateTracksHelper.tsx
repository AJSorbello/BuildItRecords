import React from 'react';
import { Track } from '../types/track';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

interface UpdateTracksHelperProps {
  tracks: Track[];
  onUpdate: (tracks: Track[]) => void;
}

const UpdateTracksHelper: React.FC<UpdateTracksHelperProps> = ({ tracks, onUpdate }) => {
  const handleUpdateTracks = async () => {
    try {
      const updatedTracks = tracks.map(track => {
        if (track.spotifyUrl && track.label !== RECORD_LABELS['Build It Deep']) {
          return {
            ...track,
            label: RECORD_LABELS['Build It Deep']
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
    <button onClick={handleUpdateTracks}>
      Update Tracks
    </button>
  );
};

export default UpdateTracksHelper;
