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
  IconButton
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
  const [hasMore, setHasMore] = React.useState(false);
  const [releaseType, setReleaseType] = React.useState<'all' | 'album' | 'single' | 'compilation'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchReleases = async (page = 1) => {
    const mappedLabelId = getLabelId(labelId || propLabel);
    const labelConfig = RECORD_LABELS[mappedLabelId];

    if (!labelConfig) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching releases for label:', labelConfig.id, 'page:', page, 'type:', releaseType);
      
      // Add the release type parameter to the API call if it's not 'all'
      const typeParam = releaseType !== 'all' ? releaseType : undefined;
      const releases = await databaseService.getReleasesByLabel(labelConfig.id, page, 50, typeParam);

      if (!releases || !Array.isArray(releases)) {
        throw new Error('No data received from server');
      }

      // Filter and validate releases
      const validReleases = releases
        .filter(release => {
          const isValid = isValidRelease(release);
          if (!isValid) {
            console.warn('Invalid release:', release);
          }
          return isValid;
        })
        .map(release => {
          // Make sure artwork_url is populated
          let artworkUrl = release.artwork_url;
          if (!artworkUrl && release.images && release.images.length > 0) {
            artworkUrl = release.images[0].url;
          }
          
          // Make sure title is populated (preferring title over name)
          let title = release.title;
          if (!title && release.name) {
            title = release.name;
          }
          
          return {
            ...release,
            title,
            artwork_url: artworkUrl || '/images/placeholder-release.jpg'
          };
        });

      // If this is page 1, replace releases, otherwise append to existing releases
      if (page === 1) {
        setReleases(validReleases);
      } else {
        setReleases(prevReleases => [...prevReleases, ...validReleases]);
      }
      
      setTotalReleases(releases.length);
      setHasMore(false);
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchReleases(currentPage + 1);
    }
  };

  const refetch = async () => {
    await fetchReleases(1);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    fetchReleases(1);
  }, [labelId, propLabel, releaseType]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Add filtering function for search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReleases(releases);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = releases.filter(release => {
      const title = (release.title || release.name || '').toLowerCase();
      const artistName = release.artists?.map(a => a.name || '').join(' ').toLowerCase() || '';
      const releaseDate = release.release_date || '';
      
      return title.includes(query) || 
             artistName.includes(query) || 
             releaseDate.includes(query);
    });

    setFilteredReleases(filtered);
  }, [searchQuery, releases]);

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
          onClick={refetch}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // Process releases from API response
  const validReleases = filteredReleases
    .filter(isValidRelease)
    .map(release => ({
      ...release,
      title: release.title || release.name || 'Untitled Release',
      artwork_url: release.artwork_url || release.images?.[0]?.url || '/placeholder.jpg',
    }));

  if (validReleases.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No {
            releaseType === 'album' ? 'albums' : 
            releaseType === 'single' ? 'singles' : 
            releaseType === 'compilation' ? 'compilations' : 'releases'
          } found for {labelConfig.displayName}
        </Typography>
        <Button
          onClick={refetch}
          sx={{ mt: 2 }}
          variant="outlined"
          color="primary"
        >
          Try Again
        </Button>
      </Box>
    );
  }

  const latestRelease = validReleases[0];
  
  // Only show the latest release section if filter is 'all' or if there are releases matching the filter
  const showLatestRelease = releaseType === 'all' || validReleases.length > 0;

  const handleSearchChange = (event: any) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    refetch();
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h2" gutterBottom>
                {releaseType === 'all' ? 'Top Releases' : 
                 releaseType === 'album' ? 'Top Albums' : 
                 releaseType === 'single' ? 'Top Singles' : 'Top Compilations'}
              </Typography>
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
              {validReleases.map((release, index) => (
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
              ))}
            </Grid>
            
            {hasMore && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default ReleasesPage;
