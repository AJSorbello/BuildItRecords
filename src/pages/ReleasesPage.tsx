import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Track } from '../types/track';
import { RECORD_LABELS } from '../constants/labels';
import { LabelKey } from '../types/labels';
import { getData } from '../utils/dataInitializer';

const ITEMS_PER_PAGE = 10;

interface ReleaseGroupProps {
  mainTrack: Track;
  versions: Track[];
}

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const IconLink = styled('a')({
  color: '#FFFFFF',
  marginRight: '16px',
  cursor: 'pointer',
  '&:hover': {
    color: '#1DB954',
  },
  textDecoration: 'none',
});

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  width: '100%',
});

const ReleaseGroup: React.FC<ReleaseGroupProps> = ({ mainTrack, versions }) => {
  const [expanded, setExpanded] = useState(false);
  const hasVersions = versions.length > 1;

  return (
    <ReleaseCard>
      <CardMedia
        component="img"
        sx={{
          width: '100%',
          aspectRatio: '1/1',
          objectFit: 'cover',
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}
        image={mainTrack.albumCover || 'https://via.placeholder.com/300'}
        alt={mainTrack.trackTitle}
        loading="lazy"
      />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
            {mainTrack.trackTitle}
          </Typography>
          {hasVersions && (
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          {mainTrack.artist}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(mainTrack.releaseDate).toLocaleDateString()}
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {mainTrack.beatportUrl && (
            <IconLink href={mainTrack.beatportUrl} target="_blank">
              <SiBeatport size={24} />
            </IconLink>
          )}
          {mainTrack.spotifyUrl && (
            <IconLink href={mainTrack.spotifyUrl} target="_blank">
              <FaSpotify size={24} />
            </IconLink>
          )}
          {mainTrack.soundcloudUrl && (
            <IconLink href={mainTrack.soundcloudUrl} target="_blank">
              <FaSoundcloud size={24} />
            </IconLink>
          )}
        </Box>

        {expanded && hasVersions && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Other Versions:
            </Typography>
            {versions.slice(1).map((version) => (
              <Box key={version.id} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  {version.trackTitle.includes('(') 
                    ? version.trackTitle.match(/\((.*?)\)/)?.[1] || 'Original Mix'
                    : 'Original Mix'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(version.releaseDate).toLocaleDateString()}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  {version.beatportUrl && (
                    <IconLink href={version.beatportUrl} target="_blank">
                      <SiBeatport size={20} />
                    </IconLink>
                  )}
                  {version.spotifyUrl && (
                    <IconLink href={version.spotifyUrl} target="_blank">
                      <FaSpotify size={20} />
                    </IconLink>
                  )}
                  {version.soundcloudUrl && (
                    <IconLink href={version.soundcloudUrl} target="_blank">
                      <FaSoundcloud size={20} />
                    </IconLink>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </ReleaseCard>
  );
};

interface ReleasesPageProps {
  label: LabelKey;
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const [trackGroups, setTrackGroups] = useState<{ mainTrack: Track; versions: Track[] }[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const groupTracks = (tracks: Track[]) => {
    const groups = new Map<string, { mainTrack: Track; versions: Track[] }>();
    
    tracks.forEach(track => {
      const baseTitle = track.trackTitle.replace(/[\s([{].*?[\])}]/g, '').trim();
      
      if (!groups.has(baseTitle)) {
        groups.set(baseTitle, {
          mainTrack: track,
          versions: [track]
        });
      } else {
        const group = groups.get(baseTitle)!;
        group.versions.push(track);
        
        if (!track.trackTitle.includes('(') || track.trackTitle.includes('Radio')) {
          group.mainTrack = track;
        }
      }
    });

    return Array.from(groups.values());
  };

  const loadMoreTracks = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const data = getData();
      const filteredTracks = data.tracks.filter(
        (track: Track) => track.recordLabel === RECORD_LABELS[label]
      );

      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const newTracks = filteredTracks.slice(start, end);

      if (newTracks.length === 0) {
        setHasMore(false);
      } else {
        const newGroups = groupTracks(newTracks);
        setTrackGroups(prev => [...prev, ...newGroups]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  }, [page, label, loading, hasMore]);

  useEffect(() => {
    // Reset when label changes
    setTrackGroups([]);
    setPage(0);
    setHasMore(true);
    loadMoreTracks();
  }, [label]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        loadMoreTracks();
      }
    }, options);

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore, loadMoreTracks]);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        {RECORD_LABELS[label]} Releases
      </Typography>

      <Grid container spacing={4}>
        {trackGroups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.mainTrack.id}>
            <ReleaseGroup
              mainTrack={group.mainTrack}
              versions={group.versions}
            />
          </Grid>
        ))}
      </Grid>

      <LoadingContainer ref={loadingRef}>
        {loading && <CircularProgress />}
        {!loading && !hasMore && trackGroups.length > 0 && (
          <Typography variant="body1" color="text.secondary">
            No more releases to load
          </Typography>
        )}
        {!loading && !hasMore && trackGroups.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No releases found
          </Typography>
        )}
      </LoadingContainer>
    </Box>
  );
};

export default ReleasesPage;
