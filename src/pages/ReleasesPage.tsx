import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useReleases, LabelId } from '../hooks/useReleases';
import { RECORD_LABELS } from '../constants/labels';

const ITEMS_PER_PAGE = 20;

const ReleaseCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(1),
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  position: 'relative',
  zIndex: 1,
  maxWidth: '100%',
  boxSizing: 'border-box'
}));

const IconLink = styled('a')({
  color: '#fff',
  marginRight: '12px',
  textDecoration: 'none',
  '&:hover': {
    color: '#1DB954'
  }
});

interface ReleasesPageProps {
  label: LabelId;
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const {
    releases,
    loading,
    error,
    refreshReleases,
    spotifyUrl,
    beatportUrl,
    soundcloudUrl
  } = useReleases(label);

  const [displayCount, setDisplayCount] = React.useState(ITEMS_PER_PAGE);

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleLoadLess = () => {
    setDisplayCount(ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading releases...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const displayedReleases = releases.slice(0, displayCount);
  const hasMore = displayCount < releases.length;

  return (
    <Box sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {label === 'records' ? 'Build It Records' : 
         label === 'tech' ? 'Build It Tech' : 
         'Build It Deep'} Releases
      </Typography>

      <Grid container spacing={3}>
        {displayedReleases.map((release) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={release.id}>
            <ReleaseCard>
              <CardMedia
                component="img"
                height="300"
                image={release.imageUrl || '/placeholder.jpg'}
                alt={release.title}
              />
              <CardContent>
                <Typography variant="h6" component="div" noWrap>
                  {release.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom noWrap>
                  {release.artist.name}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {release.spotifyUrl && (
                    <IconLink href={release.spotifyUrl} target="_blank" rel="noopener noreferrer">
                      <FaSpotify size={24} />
                    </IconLink>
                  )}
                  {beatportUrl && (
                    <IconLink href={beatportUrl} target="_blank" rel="noopener noreferrer">
                      <SiBeatport size={24} />
                    </IconLink>
                  )}
                  {soundcloudUrl && (
                    <IconLink href={soundcloudUrl} target="_blank" rel="noopener noreferrer">
                      <FaSoundcloud size={24} />
                    </IconLink>
                  )}
                </Box>
              </CardContent>
            </ReleaseCard>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        {hasMore ? (
          <IconButton onClick={handleLoadMore} size="large">
            <KeyboardArrowDownIcon />
          </IconButton>
        ) : displayCount > ITEMS_PER_PAGE && (
          <IconButton onClick={handleLoadLess} size="large">
            <KeyboardArrowUpIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ReleasesPage;
