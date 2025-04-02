import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, Alert, IconButton, Avatar, Grid, Tooltip, useTheme } from '@mui/material';
import { PlayArrow, QueueMusic, Add, MusicNote } from '@mui/icons-material';
import { Release } from '../types/release';
import { RecordLabel } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { LoadingSpinner } from './LoadingSpinner';

interface TopReleasesProps {
  label: RecordLabel;
}

const TOP_RELEASES_LIMIT = 10;

// Remove styled components and use sx prop directly
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
  const theme = useTheme();

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
        <Box sx={{ py: 2, flexGrow: 1 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Box>
    );
  }

  if (topReleases.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Top Releases
        </Typography>
        <Box sx={{ py: 2, flexGrow: 1 }}>
          <Alert severity="info">No top releases found</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Top Releases
      </Typography>
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List sx={{ width: '100%', p: 0 }}>
          {topReleases.map((release, index) => {
            const artistNames = release.artists && release.artists.length > 0
              ? release.artists.map(a => a.name).join(', ')
              : 'Various Artists';
            
            // Get popularity rank from release or use index+1 as fallback
            const popularityRank = (release as any).popularityRank || index + 1;
            
            return (
              <ListItem
                key={release.id}
                disablePadding
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  '&:hover .play-button': {
                    opacity: 1,
                  },
                  borderRadius: theme.spacing(1),
                  marginBottom: theme.spacing(0.5),
                  padding: theme.spacing(1),
                }}
                onClick={() => openSpotifyUrl(release.spotify_url || '')}
              >
                {/* Popularity Rank */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    minWidth: 30, 
                    fontWeight: 'bold',
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}
                >
                  {popularityRank}
                </Typography>
                
                <Avatar
                  src={release.artwork_url || release.images?.[0]?.url || '/images/placeholder-release.jpg'}
                  alt={release.title}
                  variant="rounded"
                  sx={{
                    width: 48,
                    height: 48,
                    marginRight: theme.spacing(2),
                    borderRadius: theme.spacing(1),
                    aspectRatio: '1/1',
                  }}
                />
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 'bold' }}
                  >
                    {release.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: 'text.secondary', display: 'block' }}
                  >
                    {artistNames}
                  </Typography>
                </Box>
                <IconButton
                  className="play-button"
                  size="small"
                  sx={{ 
                    opacity: 0.7,
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
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSpotifyUrl(release.spotify_url || '');
                  }}
                >
                  <PlayArrow />
                </IconButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};
