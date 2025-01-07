import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  SelectChangeEvent
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { Release } from '../../types';

interface TrackManagerProps {
  selectedLabel: string;
  releases: Release[];
  totalReleases: number;
  onRefresh: () => void;
}

const TRACKS_PER_PAGE = 50;

const TrackManager: React.FC<TrackManagerProps> = ({
  selectedLabel,
  releases,
  totalReleases,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const handlePlay = (trackId: string) => {
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(trackId);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const startIndex = (page - 1) * TRACKS_PER_PAGE;
  const endIndex = startIndex + TRACKS_PER_PAGE;
  const displayedReleases = releases.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalReleases / TRACKS_PER_PAGE);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Releases for {selectedLabel}
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Release Date</TableCell>
                  <TableCell>Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedReleases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>{release.name || release.title}</TableCell>
                    <TableCell>
                      {release.primaryArtist?.name || 
                       (release.artists && release.artists[0]?.name) || 
                       'Unknown Artist'}
                    </TableCell>
                    <TableCell>
                      {release.releaseDate ? 
                        new Date(release.releaseDate).toLocaleDateString() : 
                        'No date'}
                    </TableCell>
                    <TableCell>
                      {release.tracks?.[0]?.preview_url && (
                        <IconButton
                          onClick={() => handlePlay(release.id)}
                          color={currentlyPlaying === release.id ? 'primary' : 'default'}
                        >
                          {currentlyPlaying === release.id ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TrackManager;
