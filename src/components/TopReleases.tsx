import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, Alert, IconButton, Avatar, Grid, Tooltip } from '@mui/material';
import { PlayArrow, QueueMusic, Add, MusicNote } from '@mui/icons-material';
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

const AlbumArt = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  marginRight: theme.spacing(2),
  borderRadius: theme.spacing(1),
  aspectRatio: '1/1',
}));

const PlayIconButton = styled(IconButton)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: theme.palette.primary.main,
  marginLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  '& svg': {
    fontSize: 16,
  }
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

export const TopReleases = ({ label }: TopReleasesProps) => {
  const [topReleases, setTopReleases] = React.useState<Release[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const title = getTopReleasesTitle(label.id);

  React.useEffect(() => {
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

  const openSpotifyUrl = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Top Releases
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Top Releases
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!topReleases.length) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Top Releases
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No releases found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Various Artists
      </Typography>
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {topReleases.map((release, index) => (
          <Box 
            key={release.id} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
              borderRadius: 1,
              padding: 1
            }}
          >
            <Box sx={{ mr: 2 }}>
              <AlbumArt
                src={release.artwork_url || release.images?.[0]?.url}
                variant="square"
                alt={release.title}
              />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                {release.artists && release.artists.length > 0
                  ? release.artists.map(artist => artist.name).join(', ')
                  : 'Various Artists'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {release.tracks?.[0]?.title || release.title}
              </Typography>
            </Box>
            
            <Tooltip title="Play on Spotify">
              <PlayIconButton
                onClick={() => openSpotifyUrl(release.spotify_url || release.external_urls?.spotify || '')}
                aria-label="play on spotify"
              >
                <PlayArrow fontSize="small" />
              </PlayIconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
