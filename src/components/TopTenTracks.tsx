import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, IconButton } from '@mui/material';
import { PlayArrow, QueueMusic, Add } from '@mui/icons-material';
import { Release } from '../types/release';
import { RecordLabel } from '../constants/labels';
import { styled } from '@mui/material/styles';

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const RankNumber = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  width: '30px',
  textAlign: 'right',
  marginRight: theme.spacing(2),
}));

interface TopTenTracksProps {
  releases: Release[];
  label: RecordLabel;
}

const getTopTracksTitle = (labelId: string) => {
  switch (labelId) {
    case 'buildit-records':
      return 'BuildItRecordsTopTracks';
    case 'buildit-tech':
      return 'BuildItTechTopTracks';
    case 'buildit-deep':
      return 'BuildItDeepTopTracks';
    default:
      return 'Top Ten Tracks';
  }
};

export const TopTenTracks: React.FC<TopTenTracksProps> = ({ releases, label }) => {
  const title = getTopTracksTitle(label.id);

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PlayArrow />
        <QueueMusic sx={{ mx: 1 }} />
        <Add />
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>

      <List sx={{ width: '100%' }}>
        {releases.slice(0, 10).map((release, index) => {
          const track = release.tracks?.[0]; // Get the first track of the release
          if (!track) return null;

          return (
            <StyledListItem
              key={release.id}
              secondaryAction={
                <Box>
                  <IconButton edge="end" aria-label="play" size="small">
                    <PlayArrow />
                  </IconButton>
                  <IconButton edge="end" aria-label="add to queue" size="small">
                    <Add />
                  </IconButton>
                </Box>
              }
            >
              <RankNumber>{index + 1}</RankNumber>
              <ListItemText
                primary={track.name}
                secondary={release.artists?.map(artist => artist.name).join(', ')}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: 500,
                  },
                  '& .MuiListItemText-secondary': {
                    color: 'text.secondary',
                  },
                }}
              />
            </StyledListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default TopTenTracks;
