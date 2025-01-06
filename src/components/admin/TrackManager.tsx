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
import { API_URL, LABELS, LabelId } from '../../config';
import { Release, ReleasesResponse } from '../../types';

interface TrackManagerProps {
  selectedLabel?: LabelId;
  onLabelChange?: (labelId: LabelId) => void;
  releases?: Release[];
}

const TRACKS_PER_PAGE = 50;

const TrackManager: React.FC<TrackManagerProps> = ({
  selectedLabel: propSelectedLabel,
  onLabelChange,
  releases: propReleases
}) => {
  const [releases, setReleases] = useState<Release[]>(propReleases || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<LabelId>(propSelectedLabel || 'buildit-records');
  const [page, setPage] = useState(1);
  const [totalReleases, setTotalReleases] = useState(0);

  useEffect(() => {
    if (propSelectedLabel && propSelectedLabel !== selectedLabel) {
      setSelectedLabel(propSelectedLabel);
    }
  }, [propSelectedLabel]);

  useEffect(() => {
    if (selectedLabel) {
      fetchReleases(selectedLabel);
    }
  }, [selectedLabel]);

  useEffect(() => {
    // Reset to first page when releases or label changes
    setPage(1);
  }, [releases, selectedLabel]);

  useEffect(() => {
    if (propReleases) {
      setReleases(propReleases);
    }
  }, [propReleases]);

  const fetchReleases = async (labelId: LabelId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/releases/${labelId}`);
      const contentType = response.headers.get('content-type');
      
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch releases');
      }

      if (!data.releases || !Array.isArray(data.releases)) {
        throw new Error('Invalid response format');
      }

      setReleases(data.releases);
      setTotalReleases(data.totalReleases || 0);
    } catch (error) {
      console.error('Error fetching releases:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch releases');
      setReleases([]);
      setTotalReleases(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (event: SelectChangeEvent<string>) => {
    const newLabelId = event.target.value as LabelId;
    setSelectedLabel(newLabelId);
    onLabelChange?.(newLabelId);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const startIndex = (page - 1) * TRACKS_PER_PAGE;
  const endIndex = startIndex + TRACKS_PER_PAGE;
  const displayedReleases = releases.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="label-select-label">Label</InputLabel>
          <Select
            labelId="label-select-label"
            id="label-select"
            value={selectedLabel}
            label="Label"
            onChange={handleLabelChange}
          >
            {LABELS.map((label) => (
              <MenuItem key={label.id} value={label.id}>
                {label.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Release Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedReleases.map((release) => (
              <TableRow key={release.id}>
                <TableCell>{release.title}</TableCell>
                <TableCell>{release.primaryArtist.name}</TableCell>
                <TableCell>{new Date(release.releaseDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton
                    aria-label="play"
                    onClick={() => window.open(release.spotifyUrl, '_blank')}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil(totalReleases / TRACKS_PER_PAGE)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default TrackManager;
