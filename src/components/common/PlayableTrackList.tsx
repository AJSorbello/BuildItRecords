import React from 'react';
import { IconButton } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { Track } from '../../types/models';
import { TrackList, TrackListProps } from './TrackList';

interface PlayableTrackListProps extends Omit<TrackListProps, 'renderTrackActions'> {
  currentTrack?: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPauseTrack: () => void;
}

export const PlayableTrackList: React.FC<PlayableTrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPauseTrack,
  ...trackListProps
}) => {
  const handlePlayClick = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      onPauseTrack();
    } else {
      onPlayTrack(track);
    }
  };

  const renderTrackActions = (track: Track) => (
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        handlePlayClick(track);
      }}
      size="small"
    >
      {currentTrack?.id === track.id && isPlaying ? (
        <Pause />
      ) : (
        <PlayArrow />
      )}
    </IconButton>
  );

  return (
    <TrackList
      tracks={tracks}
      renderTrackActions={renderTrackActions}
      {...trackListProps}
    />
  );
};
