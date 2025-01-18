import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, Alert, IconButton, Avatar } from '@mui/material';
import { PlayArrow, QueueMusic, Add } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Release } from '../types/release';
import { RecordLabel } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { LoadingSpinner } from './LoadingSpinner';

interface TopReleasesProps {
  label: RecordLabel;
}

const TOP_RELEASES_LIMIT = 10;

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  padding: theme.spacing(1),
}));

const PlayCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginLeft: theme.spacing(2),
}));

const AlbumArt = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  marginRight: theme.spacing(2),
  borderRadius: theme.spacing(1),
}));

const getTopReleasesTitle = (labelId: string) => {
  switch (labelId) {
    case 'buildit-records':
      return 'BuildItRecordsTop10';
    case 'buildit-tech':
      return 'BuildItTechTop10';
    case 'buildit-deep':
      return 'BuildItDeepTop10';
    default:
      return `Top ${TOP_RELEASES_LIMIT} Releases`;
  }
};

const formatPlayCount = (tracks: any[]) => {
  if (!tracks || !tracks.length) return '0 plays';
  
  // Sum up all track popularities and multiply by 1000 for a more realistic number
  const totalPlays = tracks.reduce((sum, track) => sum + ((track.popularity || 0) * 1000), 0);
  
  if (totalPlays >= 1000000) {
    return `${(totalPlays / 1000000).toFixed(1)}M plays`;
  }
  if (totalPlays >= 1000) {
    return `${(totalPlays / 1000).toFixed(1)}K plays`;
  }
  return `${totalPlays} plays`;
};

const TopReleases: React.FC<TopReleasesProps> = ({ label }) => {
  const [topReleases, setTopReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = getTopReleasesTitle(label.id);

  useEffect(() => {
    const fetchTopReleases = async () => {
      if (!label?.id) return;

      try {
        setLoading(true);
        setError(null);
        const releases = await databaseService.getTopReleases(label.id);
        setTopReleases(releases.slice(0, TOP_RELEASES_LIMIT));
      } catch (error) {
        console.error('Error fetching top releases:', error);
        setError('Unable to load top releases');
        setTopReleases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopReleases();
  }, [label]);

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PlayArrow />
          <QueueMusic sx={{ mx: 1 }} />
          <Add />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LoadingSpinner />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PlayArrow />
          <QueueMusic sx={{ mx: 1 }} />
          <Add />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!topReleases.length) {
    return (
      <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PlayArrow />
          <QueueMusic sx={{ mx: 1 }} />
          <Add />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          No releases found
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PlayArrow />
        <QueueMusic sx={{ mx: 1 }} />
        <Add />
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>

      <List sx={{ width: '100%' }}>
        {topReleases.map((release, index) => (
          <StyledListItem
            key={release.id}
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PlayCount>
                  {formatPlayCount(release.tracks)}
                </PlayCount>
                <IconButton edge="end" aria-label="play" size="small" sx={{ ml: 1 }}>
                  <PlayArrow />
                </IconButton>
                <IconButton edge="end" aria-label="add to queue" size="small">
                  <Add />
                </IconButton>
              </Box>
            }
          >
            <AlbumArt
              src={release.artwork_url || release.images?.[0]?.url}
              variant="square"
              alt={release.name}
            />
            <ListItemText
              primary={release.name}
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
        ))}
      </List>
    </Paper>
  );
};

export default TopReleases;
