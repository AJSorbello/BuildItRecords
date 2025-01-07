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

const TrackManager: React.FC<TrackManagerProps> = ({
  selectedLabel,
  releases,
  totalReleases,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const handlePlay = (trackId: string) => {
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(trackId);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {totalReleases} Releases Found
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Artwork</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Release Date</TableCell>
                <TableCell>Preview</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell>
                    {release.artworkUrl && (
                      <img 
                        src={release.artworkUrl} 
                        alt={release.name} 
                        style={{ width: '50px', height: '50px' }} 
                      />
                    )}
                  </TableCell>
                  <TableCell>{release.name || release.title}</TableCell>
                  <TableCell>
                    {release.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist'}
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
      )}
    </Box>
  );
};

export default TrackManager;
