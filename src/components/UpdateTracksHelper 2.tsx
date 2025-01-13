import React, { useEffect } from 'react';
import { RECORD_LABELS } from '../constants/labels';

interface Track {
  spotifyUrl: string;
  recordLabel: string;
}

const UpdateTracksHelper: React.FC = () => {
  useEffect(() => {
    // Get current tracks from localStorage
    const tracksJson = localStorage.getItem('tracks');
    if (!tracksJson) {
      console.log('No tracks found in localStorage');
      return;
    }

    const tracks: Track[] = JSON.parse(tracksJson);
    console.log('Current tracks:', tracks);

    // Update tracks that should be under Build It Deep
    const updatedTracks = tracks.map((track: Track) => {
      // If the track was previously imported but not assigned to Deep, update it
      if (track.spotifyUrl && track.recordLabel !== RECORD_LABELS['Build It Deep']) {
        return {
          ...track,
          recordLabel: RECORD_LABELS['Build It Deep']
        };
      }
      return track;
    });

    // Save updated tracks back to localStorage
    localStorage.setItem('tracks', JSON.stringify(updatedTracks));
    console.log('Updated tracks:', updatedTracks);

    // Force a page reload to reflect changes
    window.location.reload();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      Updating tracks... Check the console for details.
    </div>
  );
};

export default UpdateTracksHelper;
