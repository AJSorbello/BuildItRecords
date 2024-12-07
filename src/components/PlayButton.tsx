import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FaPlay, FaPause } from 'react-icons/fa';
import { SxProps, Theme } from '@mui/material/styles';

interface PlayButtonProps {
  previewUrl: string | null;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

const PlayButton: React.FC<PlayButtonProps> = ({ previewUrl, size = 'medium', sx }) => {
  const [audio] = useState(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (!previewUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = previewUrl;
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // Clean up audio on unmount
  React.useEffect(() => {
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  if (!previewUrl) {
    return null;
  }

  return (
    <Tooltip title={isPlaying ? 'Pause' : 'Play Preview'}>
      <IconButton
        onClick={handlePlay}
        size={size}
        sx={{ color: 'primary.main', ...sx }}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </IconButton>
    </Tooltip>
  );
};

export default PlayButton;
