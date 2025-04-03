import React from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Button, 
  Box, 
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  ButtonGroup,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ReleaseCard } from '../components/ReleaseCard';
import { useParams } from 'react-router-dom';
import { Release } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { formatDate } from '../utils/dateUtils';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { TopReleases } from '../components/TopReleases';
import { labelColors } from '../theme/theme';
import { useInView } from 'react-intersection-observer';

// Map route labels to RECORD_LABELS keys
const getLabelId = (label: string | RecordLabel | undefined): string => {
  if (!label) return 'buildit-records'; // Default to buildit-records if undefined
  
  // If label is a RecordLabel object, return its id
  if (typeof label === 'object' && 'id' in label) {
    return label.id;
  }
  
  // Handle string label
  const labelMap: { [key: string]: string } = {
    'records': 'buildit-records',
    'tech': 'buildit-tech',
    'deep': 'buildit-deep'
  };
  return labelMap[label] || label;
};

// Helper function to verify if a release object is valid
const isValidRelease = (release: any): release is Release => {
  return (
    release &&
    typeof release === 'object' &&
    typeof release.id === 'string' &&
    (typeof release.title === 'string' || typeof release.name === 'string')
  );
};

interface ReleasesPageProps {
  label?: RecordLabel | string;
}

interface ReleasesPageState {
  releases: Release[];
  loading: boolean;
  error: string | null;
  totalReleases: number;
  currentPage: number;
  hasMore: boolean;
  isMobile: boolean;
}

interface ReleaseSectionProps {
  release: Release;
  onClick?: () => void;
  ranking?: number;
}

export const ReleaseSection = ({ release, onClick, ranking }: ReleaseSectionProps) => {
  if (!release || !isValidRelease(release)) {
    console.error('Invalid release passed to ReleaseSection:', release);
    return null;
  }

  return <ReleaseCard release={release} onClick={onClick} ranking={ranking} />;
}

export const ReleasesPage = ({ label: propLabel }: ReleasesPageProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { labelId } = useParams<{ labelId: string }>();
  const [releases, setReleases] = React.useState<Release[]>([]);
  const [filteredReleases, setFilteredReleases] = React.useState<Release[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalReleases, setTotalReleases] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [releaseType, setReleaseType] = React.useState<'all' | 'album' | 'single' | 'compilation'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Use intersection observer to load more releases when user scrolls to bottom
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Track if initial data has loaded
  const [initialDataLoaded, setInitialDataLoaded] = React.useState(false);
  
  // Track visible releases (for virtualization)
  const [visibleReleases, setVisibleReleases] = React.useState<number>(10);

  // Small batch size to ensure smooth loading
  const ITEMS_PER_PAGE = 10;

  // Optimize with useMemo for filtering releases
  const validReleases = React.useMemo(() => {
    if (!initialDataLoaded) return [];
    
    if (searchQuery.trim() !== '') {
      // Filter by search query
      const lowerQuery = searchQuery.toLowerCase();
      return releases.filter(release => 
        (release.title?.toLowerCase().includes(lowerQuery) || 
         release.name?.toLowerCase().includes(lowerQuery) ||
         release.artists?.some(artist => artist.name?.toLowerCase().includes(lowerQuery))) &&
        isValidRelease(release)
      );
    }
    return releases.filter(isValidRelease);
  }, [releases, searchQuery, initialDataLoaded]);

  const fetchReleases = async (page = 1) => {
    if (loading && page > 1) return; // Prevent multiple concurrent loads
    
    setLoading(true);
    const mappedLabelId = getLabelId(labelId || propLabel);
    const labelConfig = RECORD_LABELS[mappedLabelId];

    if (!labelConfig) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching releases for page ${page} with limit ${ITEMS_PER_PAGE}`);
      
      // Use the modified DatabaseService method that now takes a smaller page size
      const typeParam = releaseType !== 'all' ? releaseType : undefined;
      const fetchedReleases = await databaseService.getReleasesByLabel(
        labelConfig.id,
        page,
        ITEMS_PER_PAGE,
        typeParam
      );

      if (!Array.isArray(fetchedReleases)) {
        throw new Error('Invalid response from API');
      }

      // Filter out invalid releases
      const validFetchedReleases = fetchedReleases.filter(isValidRelease);
      console.log(`Fetched ${validFetchedReleases.length} valid releases for page ${page}`);

      // Check if we received an empty array or fewer items than requested
      // If so, we've reached the end of all releases
      if (validFetchedReleases.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      // Append new releases or replace if page 1
      if (page === 1) {
        setReleases(validFetchedReleases);
      } else {
        // Check if we've already loaded these releases (prevent duplicates)
        const existingReleaseIds = new Set(releases.map(r => r.id));
        const newReleases = validFetchedReleases.filter(r => !existingReleaseIds.has(r.id));
        
        // If we didn't get any new releases that we don't already have, we've reached the end
        if (newReleases.length === 0) {
          setHasMore(false);
          setLoading(false);
          return;
        }
        
        setReleases(prev => [...prev, ...newReleases]);
      }

      // Set loading state and pagination
      setLoading(false);
      setInitialDataLoaded(true);
      setCurrentPage(page);
      
      // Determine if there might be more pages
      // If we got fewer items than requested per page, we've reached the end
      setHasMore(validFetchedReleases.length >= ITEMS_PER_PAGE);
      
      // Reset visible count on first page load
      if (page === 1) {
        setVisibleReleases(Math.min(10, validFetchedReleases.length));
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
      setError('Failed to load releases. Please try again.');
      setLoading(false);
      // Also set hasMore to false on error after a few attempts
      if (page > 3) {
        setHasMore(false);
      }
    }
  };
  
  const loadMore = () => {
    if (loading || !hasMore) return;
    
    const nextPage = currentPage + 1;
    fetchReleases(nextPage);
  };

  // Reset page when label or type changes
  React.useEffect(() => {
    setReleases([]);
    setFilteredReleases([]);
    setCurrentPage(1);
    setHasMore(true);
    setLoading(true);
    setInitialDataLoaded(false);
    setVisibleReleases(10);
    fetchReleases(1);
  }, [labelId, propLabel, releaseType]);

  // Monitor for infinite scrolling
  React.useEffect(() => {
    if (inView && initialDataLoaded && !loading) {
      if (visibleReleases < validReleases.length) {
        // First show more of already loaded releases
        setVisibleReleases(prev => Math.min(prev + 10, validReleases.length));
      } else if (hasMore) {
        // Load more releases when we've shown all currently loaded ones
        loadMore();
      }
    }
  }, [inView, initialDataLoaded, loading, validReleases.length, visibleReleases, hasMore]);

  const labelIdString = (labelId || propLabel || 'records');
  const mappedLabelId = getLabelId(labelIdString);
  const labelConfig = RECORD_LABELS[mappedLabelId];
  const currentLabelKey = typeof labelIdString === 'string' ? labelIdString : 
                          (typeof labelIdString === 'object' && 'id' in labelIdString ? labelIdString.id : 'records');
  
  // Ensure currentLabelKey is one of the valid keys for labelColors or use default
  const validLabelKey = (currentLabelKey === 'records' || currentLabelKey === 'tech' || currentLabelKey === 'deep') 
                        ? currentLabelKey : 'records';
  const labelColor = labelColors[validLabelKey] || '#02FF95';

  // Generate gradient background based on the label
  const getGradientBackground = () => {
    if (currentLabelKey === 'deep') {
      return `linear-gradient(45deg, ${alpha(labelColor, 0.05)}, ${alpha(labelColor, 0.1)}, ${alpha(labelColor, 0.05)})`;
    } else if (currentLabelKey === 'tech') {
      return `linear-gradient(45deg, ${alpha(labelColor, 0.05)}, ${alpha(labelColor, 0.1)}, ${alpha(labelColor, 0.05)})`;
    } else if (currentLabelKey === 'records') {
      return `linear-gradient(45deg, ${alpha(labelColor, 0.05)}, ${alpha(labelColor, 0.1)}, ${alpha(labelColor, 0.05)})`;
    }
    return 'transparent';
  };

  if (!labelConfig) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid label: {typeof labelIdString === 'string' ? labelIdString : 
                         (typeof labelIdString === 'object' && 'id' in labelIdString ? labelIdString.id : 'unknown')}
        </Typography>
      </Box>
    );
  }

  if (loading && releases.length === 0) return <CircularProgress />;

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!Array.isArray(releases)) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid releases data
        </Typography>
        <Button
          startIcon={<CircularProgress />}
          onClick={fetchReleases}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // Process releases from API response
  const latestRelease = validReleases[0];
  
  // Only show the latest release section if filter is 'all' or if there are releases matching the filter
  const showLatestRelease = releaseType === 'all' || validReleases.length > 0;

  const handleSearchChange = (event: any) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    fetchReleases(1);
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8, background: getGradientBackground() }}>
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: labelConfig.id === 'buildit-records' ? '#02FF95' : 
                     labelConfig.id === 'buildit-tech' ? '#FF0000' : 
                     labelConfig.id === 'buildit-deep' ? '#00BFFF' : '#02FF95'
            }}
          >
            {labelConfig ? `${labelConfig.name} Releases` : 'All Releases'}
          </Typography>
          
          {/* Search Input - Styled to match the Artists page */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search releases..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => setSearchQuery('')}
                    size="small"
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)'
                },
                '&:hover fieldset': {
                  borderColor: `rgba(2, 255, 149, 0.5)`
                },
                '&.Mui-focused fieldset': {
                  borderColor: labelConfig.id === 'buildit-records' ? '#02FF95' : 
                               labelConfig.id === 'buildit-tech' ? '#FF0000' : 
                               labelConfig.id === 'buildit-deep' ? '#00BFFF' : '#02FF95'
                }
              },
              '& .MuiInputBase-input': {
                color: '#ffffff'
              }
            }}
          />
          
          {/* Refresh Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
            <Button 
              size="small" 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Display "No matches found" when search has no results */}
        {!loading && validReleases.length === 0 && searchQuery && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6">No matches found for "{searchQuery}"</Typography>
            <Button 
              variant="outlined" 
              onClick={() => setSearchQuery('')}
              sx={{ mt: 2 }}
            >
              Clear Search
            </Button>
          </Box>
        )}
        
        {showLatestRelease && validReleases.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h2" gutterBottom>
                Latest Release
              </Typography>
              {loading && !initialDataLoaded ? (
                <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
              ) : (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: isMobile ? 2 : 3, 
                    borderRadius: 2,
                    height: '100%',
                    transition: 'transform 0.3s ease-in-out',
                    background: getGradientBackground(),
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <ReleaseSection 
                    release={latestRelease}
                    ranking={1} 
                    onClick={() => { /* No operation needed */ }} 
                  />
                </Paper>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h2" gutterBottom>
                {releaseType === 'all' ? 'Top Releases' : 
                 releaseType === 'album' ? 'Top Albums' : 
                 releaseType === 'single' ? 'Top Singles' : 'Top Compilations'}
              </Typography>
              {loading && !initialDataLoaded ? (
                <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
              ) : (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: isMobile ? 2 : 3, 
                    borderRadius: 2,
                    height: '100%',
                    background: getGradientBackground()
                  }}
                >
                  <TopReleases label={labelConfig} />
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {validReleases.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              {releaseType === 'all' ? 'All Releases' : 
               releaseType === 'album' ? 'All Albums' : 
               releaseType === 'single' ? 'All Singles' : 'All Compilations'}
            </Typography>
            <Grid container spacing={3}>
              {loading && !initialDataLoaded ? (
                // Show skeletons while loading initial data
                Array.from(new Array(6)).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height={280} 
                      sx={{ borderRadius: 2, mb: 1 }} 
                    />
                    <Skeleton variant="text" height={24} width="70%" />
                    <Skeleton variant="text" height={20} width="40%" />
                  </Grid>
                ))
              ) : (
                // Show only a subset of releases for better performance
                validReleases.slice(0, visibleReleases).map((release, index) => (
                  <Grid item xs={12} sm={6} md={4} key={release.id}>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        background: getGradientBackground(),
                        height: '100%',
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <ReleaseSection release={release} ranking={index + 1} />
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
            
            {/* IntersectionObserver ref for infinite scrolling */}
            <Box ref={loadMoreRef} sx={{ mt: 4, textAlign: 'center', p: 2 }}>
              {loading ? (
                <CircularProgress size={32} thickness={4} />
              ) : hasMore ? (
                <Button 
                  variant="text" 
                  onClick={() => {
                    if (visibleReleases < validReleases.length) {
                      // First show more of already loaded releases
                      setVisibleReleases(prev => Math.min(prev + 10, validReleases.length));
                    } else {
                      // Then load more releases if needed
                      loadMore();
                    }
                  }}
                >
                  Show More
                </Button>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No more releases to load
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default ReleasesPage;
