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
  Paper
} from '@mui/material';
import { ReleaseCard } from '../components/ReleaseCard';
import { useParams } from 'react-router-dom';
import { Release } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { formatDate } from '../utils/dateUtils';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { TopReleases } from '../components/TopReleases';

// Map route labels to RECORD_LABELS keys
const getLabelId = (label: string): string => {
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
    typeof release.title === 'string'
  );
};

interface ReleasesPageProps {
  label?: RecordLabel;
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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalReleases, setTotalReleases] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);

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

      console.log('Fetching releases for label:', labelConfig.id, 'page:', page);
      const data = await databaseService.getReleasesByLabelId(labelConfig.id, page);

      if (!data) {
        throw new Error('No data received from server');
      }

      // Filter and validate releases
      const validReleases = data.releases
        .filter(release => {
          const isValid = isValidRelease(release);
          if (!isValid) {
            console.warn('Invalid release:', release);
          }
          return isValid;
        })
        .map(release => ({
          ...release,
          artwork_url: release.artwork_url || release.images?.[0]?.url || undefined
        }));

      setReleases(validReleases);
      setTotalReleases(data.totalReleases || 0);
      setHasMore(data.hasMore || false);
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const { loading, hasMore, currentPage } = { loading, hasMore, currentPage };
    if (!loading && hasMore) {
      await fetchReleases(currentPage + 1);
    }
  };

  const refetch = async () => {
    await fetchReleases(1);
  };

  React.useEffect(() => {
    fetchReleases(1);
  }, [labelId, propLabel]);

  const labelConfig = RECORD_LABELS[getLabelId(labelId || propLabel)];

  if (!labelConfig) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Invalid label: {labelId || propLabel}
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

  // Validate releases
  const validReleases = releases.filter(isValidRelease);

  if (validReleases.length === 0) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          No releases found for {labelConfig.displayName}
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

  const latestRelease = validReleases[0];

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {labelConfig.displayName} Releases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalReleases} releases
          </Typography>
        </Box>
        
        {validReleases.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Latest Release
            </Typography>
            <Paper 
              elevation={3} 
              sx={{ 
                p: isMobile ? 2 : 3, 
                borderRadius: 2,
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <ReleaseSection 
                release={latestRelease}
                ranking={1} 
                onClick={() => {}} 
              />
            </Paper>
          </Box>
        )}

        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            All Releases
          </Typography>
          <Grid container spacing={3}>
            {validReleases.map((release, index) => (
              <Grid item xs={12} sm={6} md={4} key={release.id}>
                <ReleaseSection release={release} ranking={index + 1} />
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

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Top Releases
          </Typography>
          <TopReleases label={labelConfig} />
        </Box>
      </Container>
    </ErrorBoundary>
  );
};
