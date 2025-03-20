import React from 'react';
import { Box } from '@mui/material';

interface AlbumCoverProps {
  src?: string;
  alt?: string;
  size?: number;
}

export const AlbumCover: React.FC<AlbumCoverProps> = ({ src, alt = 'Album Cover', size = 300 }) => {
  const fallbackStyle = {
    width: size,
    height: size,
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#757575',
    fontSize: size / 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  };

  if (!src) {
    return (
      <Box sx={fallbackStyle}>
        Album Art
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: size,
        height: size,
        objectFit: 'cover',
      }}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        target.parentElement!.style.width = `${size}px`;
        target.parentElement!.style.height = `${size}px`;
        target.parentElement!.style.backgroundColor = '#e0e0e0';
        target.parentElement!.style.display = 'flex';
        target.parentElement!.style.alignItems = 'center';
        target.parentElement!.style.justifyContent = 'center';
        target.parentElement!.style.color = '#757575';
        target.parentElement!.style.fontSize = `${size / 10}px`;
        target.parentElement!.style.fontWeight = 'bold';
        target.parentElement!.style.textTransform = 'uppercase';
        target.parentElement!.textContent = 'Album Art';
      }}
    />
  );
};
