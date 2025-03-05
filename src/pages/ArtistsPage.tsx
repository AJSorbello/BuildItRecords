import React, { Component } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Skeleton,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { debounce } from 'lodash';
import { useLocation, Location } from 'react-router-dom';
import { databaseService } from '../services/DatabaseService';
import { DatabaseError } from '../utils/errors';
import ArtistCard from '../components/ArtistCard';
import ArtistModal from '../components/modals/ArtistModal';
import { ErrorBoundary } from '../components/ErrorBoundary'; 
import { Artist } from '../types/artist';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { RECORD_LABELS } from '../constants/labels';
import { labelColors } from '../theme/theme';

// Removed ITEMS_PER_PAGE constant as we're showing all artists

interface SearchState {
  total: number;
}

interface ArtistsPageProps {
  label: keyof typeof RECORD_LABELS;
  location?: Location;
}

const ArtistSection: React.FC<{ 
  artist: Artist; 
  onArtistClick: (artist: Artist) => void;
  background?: string;
}> = ({ artist, onArtistClick, background }) => {
  if (!artist || typeof artist !== 'object') {
    console.error('Invalid artist passed to ArtistSection:', artist);
    return null;
  }

  return (
    <ErrorBoundary>
      <ArtistCard artist={artist} onClick={() => onArtistClick(artist)} background={background} />
    </ErrorBoundary>
  );
};

// Wrapper component to handle hooks
function ArtistsPageWrapper(props: ArtistsPageProps) {
  const location = useLocation();
  const theme = useTheme();
  return <ArtistsPage {...props} location={location} />;
}

interface ArtistsPageState {
  artists: Artist[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedArtist: Artist | null;
  searchState: SearchState;
  modalOpen: boolean;
}

class ArtistsPage extends Component<ArtistsPageProps, ArtistsPageState> {
  debouncedSearch: any;

  constructor(props: ArtistsPageProps) {
    super(props);
    this.state = {
      artists: [],
      loading: false,
      error: null,
      searchTerm: '',
      selectedArtist: null,
      searchState: {
        total: 0
      },
      modalOpen: false
    };

    this.debouncedSearch = debounce(this.fetchArtists, 500);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleArtistClick = this.handleArtistClick.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  componentDidMount() {
    this.fetchArtists();
  }

  componentDidUpdate(prevProps: ArtistsPageProps) {
    if (prevProps.label !== this.props.label) {
      this.fetchArtists();
    }
  }

  getLabelId() {
    const { label } = this.props;
    // Map route label names to full label IDs
    const labelMap: Record<string, string> = {
      'records': 'buildit-records',
      'tech': 'buildit-tech',
      'deep': 'buildit-deep'
    };
    
    return labelMap[label] || 'buildit-tech';
  }

  getTitle() {
    const { label } = this.props;
    const titleMap: Record<string, string> = {
      'records': 'Build It Records Artists',
      'tech': 'Build It Tech Artists',
      'deep': 'Build It Deep Artists'
    };
    
    return titleMap[label] || 'Build It Tech Artists';
  }

  getFilteredArtists() {
    const { artists, searchTerm } = this.state;
    
    if (!searchTerm.trim()) {
      return artists;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return artists.filter(artist => 
      artist.name?.toLowerCase().includes(lowerSearchTerm)
    );
  }

  async fetchArtists() {
    try {
      this.setState({ loading: true, error: null });
      
      const labelId = this.getLabelId();
      console.log('Fetching artists for label ID:', labelId);
      
      const artists = await databaseService.getArtistsForLabel(labelId);
      console.log('Artists fetched successfully:', artists.length);
      
      this.setState({
        artists,
        loading: false,
        searchState: {
          total: artists.length
        }
      });
    } catch (error) {
      console.error('Error fetching artists:', error);
      
      let errorMessage = 'Failed to fetch artists. Please try again.';
      if (error instanceof DatabaseError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = `${error.name}: ${error.message}`;
      }
      
      console.error('Detailed error:', errorMessage);
      
      this.setState({
        loading: false,
        error: errorMessage,
        artists: [] // Ensure artists is set to an empty array on error
      });
    }
  }

  handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const searchTerm = event.target.value;
    this.setState({ 
      searchTerm
    });
    this.debouncedSearch();
  }

  handleArtistClick(artist: Artist) {
    this.setState({
      selectedArtist: artist,
      modalOpen: true
    });
  }

  handleModalClose() {
    this.setState({ modalOpen: false });
  }

  handleRefresh() {
    this.setState({
      searchTerm: ''
    });
    this.fetchArtists();
  }

  renderContent() {
    const { loading, error, artists } = this.state;
    const filteredArtists = this.getFilteredArtists();
    const labelColor = labelColors[this.props.label] || '#02FF95';

    // Generate gradient background for artist cards
    const getGradientBackground = () => {
      const labelKey = this.props.label;
      if (labelKey === 'deep') {
        return `linear-gradient(45deg, ${alpha(labelColor, 0.05)}, ${alpha(labelColor, 0.1)}, ${alpha(labelColor, 0.05)})`;
      } else if (labelKey === 'tech') {
        return `linear-gradient(45deg, ${alpha(labelColor, 0.05)}, ${alpha(labelColor, 0.1)}, ${alpha(labelColor, 0.05)})`;
      } else if (labelKey === 'records') {
        return `linear-gradient(45deg, ${alpha(labelColor, 0.05)}, ${alpha(labelColor, 0.1)}, ${alpha(labelColor, 0.05)})`;
      }
      return 'transparent';
    };
    
    const backgroundGradient = getGradientBackground();

    if (loading && artists.length === 0) {
      return (
        <Grid container spacing={3}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
              <Skeleton variant="text" height={20} width="60%" />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={this.handleRefresh}>
              <RefreshIcon sx={{ mr: 1 }} />
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      );
    }

    if (filteredArtists.length === 0) {
      return (
        <Box textAlign="center" py={5}>
          <Typography variant="h6" gutterBottom>
            No artists found
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {this.state.searchTerm 
              ? "Try a different search term" 
              : "No artists are available for this label yet"}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={this.handleRefresh}
          >
            <RefreshIcon sx={{ mr: 1 }} />
            Refresh
          </Button>
        </Box>
      );
    }

    return (
      <>
        <Grid container spacing={3}>
          {filteredArtists.map(artist => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <ArtistSection 
                artist={artist} 
                onArtistClick={this.handleArtistClick}
                background={backgroundGradient}
              />
            </Grid>
          ))}
        </Grid>
      </>
    );
  }

  render() {
    const { selectedArtist, modalOpen } = this.state;
    const labelId = this.getLabelId();
    const labelColor = labelColors[this.props.label] || '#02FF95';

    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: labelColor
            }}
          >
            {this.getTitle()}
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by artist name..."
            value={this.state.searchTerm}
            onChange={this.handleSearchChange}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: 'background.paper',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)'
                },
                '&:hover fieldset': {
                  borderColor: `${alpha(labelColor, 0.5)}`
                },
                '&.Mui-focused fieldset': {
                  borderColor: labelColor
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: labelColor
              },
              '& .MuiInputBase-input': {
                color: '#ffffff'
              }
            }}
          />
          
          {this.state.loading && this.state.artists.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="textSecondary">
                Updating artists...
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
            <Button 
              size="small" 
              startIcon={<RefreshIcon />} 
              onClick={this.handleRefresh}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        {this.renderContent()}
        
        {selectedArtist && (
          <ArtistModal
            open={modalOpen}
            onClose={this.handleModalClose}
            artist={selectedArtist}
          />
        )}
      </Container>
    );
  }
}

export default ArtistsPageWrapper;
