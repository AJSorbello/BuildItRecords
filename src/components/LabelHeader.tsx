import React from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import PeopleIcon from '@mui/icons-material/People';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import BeatportIcon from '../assets/icons/BeatportIcon';

interface LabelHeaderProps {
  label: 'records' | 'tech' | 'deep';
  platformLinks: {
    spotify: string;
    beatport: string;
    soundcloud: string;
  };
}

const LabelHeader: React.FC<LabelHeaderProps> = ({ label, platformLinks }) => {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const handlePlatformPress = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleArtistsPress = () => {
    navigate('/artists');
  };

  return (
    <Box sx={{ 
      padding: '10px 20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: colors.card 
    }}>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', justifyContent: 'space-around' }}>
        <Button
          variant="contained"
          startIcon={<MusicNoteIcon />}
          onClick={() => handlePlatformPress(platformLinks.spotify)}
          sx={{
            backgroundColor: '#1DB954',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#1aa34a'
            }
          }}
        >
          Spotify
        </Button>

        <Button
          variant="contained"
          startIcon={<BeatportIcon />}
          onClick={() => handlePlatformPress(platformLinks.beatport)}
          sx={{
            backgroundColor: '#FF6B00',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#e66000'
            }
          }}
        >
          Beatport
        </Button>

        <Button
          variant="contained"
          startIcon={<CloudQueueIcon />}
          onClick={() => handlePlatformPress(platformLinks.soundcloud)}
          sx={{
            backgroundColor: '#FF7700',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#e66a00'
            }
          }}
        >
          SoundCloud
        </Button>

        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={handleArtistsPress}
          sx={{
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#1aa34a'
            }
          }}
        >
          Artists
        </Button>
      </Stack>
    </Box>
  );
};

export default LabelHeader;
