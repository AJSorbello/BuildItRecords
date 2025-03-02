import React, { Component } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Skeleton,
  useTheme
} from '@mui/material';
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

const ITEMS_PER_PAGE = 12;

interface SearchState {
  total: number;
  page: number;
}

interface ArtistsPageProps {
  label: keyof typeof RECORD_LABELS;
  location?: Location;
}

const ArtistSection: React.FC<{ artist: Artist; onArtistClick: (artist: Artist) => void }> = ({ artist, onArtistClick }) => {
  if (!artist || typeof artist !== 'object') {
    console.error('Invalid artist passed to ArtistSection:', artist);
    return null;
  }

  return (
    <ErrorBoundary>
      <ArtistCard artist={artist} onClick={() => onArtistClick(artist)} />
    </ErrorBoundary>
  );
};

// Wrapper component to handle hooks
const ArtistsPageWrapper: React.FC<Omit<ArtistsPageProps, 'location'>> = (props) => {
  const location = useLocation();
  const theme = useTheme();
  
  return <ArtistsPageClass {...props} location={location} />;
};

interface ArtistsPageState {
  artists: Artist[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedArtist: Artist | null;
  searchState: SearchState;
  modalOpen: boolean;
}

class ArtistsPageClass extends Component<ArtistsPageProps, ArtistsPageState> {
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
        total: 0,
        page: 1,
      },
      modalOpen: false
    };

    this.debouncedSearch = debounce(this.fetchArtists, 500);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
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
    const labelKey = this.props.label;
    // Map the short label name to the full label ID
    switch(labelKey) {
      case 'tech':
        return 'buildit-tech';
      case 'deep':
        return 'buildit-deep';
      case 'records':
      default:
        return 'buildit-records';
    }
  }

  getTitle() {
    switch (this.props.label) {
      case 'tech':
        return 'BuildIt Tech Artists';
      case 'deep':
        return 'BuildIt Deep Artists';
      default:
        return 'BuildIt Records Artists';
    }
  }

  getFilteredArtists() {
    const { artists, searchTerm } = this.state;
    if (!searchTerm.trim()) return artists;
    
    const term = searchTerm.toLowerCase();
    return artists.filter(artist => 
      artist.name.toLowerCase().includes(term) || 
      (artist.genres && artist.genres.some(genre => genre.toLowerCase().includes(term)))
    );
  }

  getPaginatedArtists() {
    const filteredArtists = this.getFilteredArtists();
    const { page } = this.state.searchState;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredArtists.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
          ...this.state.searchState,
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
      searchTerm,
      searchState: {
        ...this.state.searchState,
        page: 1
      }
    });
    this.debouncedSearch();
  }

  handlePageChange(event: React.ChangeEvent<unknown>, page: number) {
    this.setState({
      searchState: {
        ...this.state.searchState,
        page
      }
    });
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
      searchTerm: '',
      searchState: {
        ...this.state.searchState,
        page: 1
      }
    });
    this.fetchArtists();
  }

  renderContent() {
    const { loading, error } = this.state;
    
    if (loading && this.state.artists.length === 0) {
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

    const filteredArtists = this.getFilteredArtists();
    const paginatedArtists = this.getPaginatedArtists();
    const totalPages = Math.ceil(filteredArtists.length / ITEMS_PER_PAGE);

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
          {paginatedArtists.map(artist => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <ArtistSection 
                artist={artist} 
                onArtistClick={this.handleArtistClick} 
              />
            </Grid>
          ))}
        </Grid>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination 
              count={totalPages} 
              page={this.state.searchState.page} 
              onChange={this.handlePageChange} 
              color="primary" 
              size="large"
            />
          </Box>
        )}
      </>
    );
  }

  render() {
    const { selectedArtist, modalOpen } = this.state;
    const labelId = this.getLabelId();
    const labelColor = RECORD_LABELS[this.props.label]?.color || '#02FF95';

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
            placeholder="Search by artist name or genre..."
            value={this.state.searchTerm}
            onChange={this.handleSearchChange}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: 'background.paper',
              }
            }}
          />
        </Box>

        {this.renderContent()}

        {selectedArtist && (
          <ArtistModal
            open={modalOpen}
            artist={selectedArtist}
            onClose={this.handleModalClose}
            label={this.props.label}
          />
        )}
      </Container>
    );
  }
}

export default ArtistsPageWrapper;
