import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Avatar
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import { Track } from '../../types/track';
import { formatDate } from '../../utils/dateUtils';

interface TrackManagerProps {
  tracks?: Track[];
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: string) => void;
}

const TrackManager: React.FC<TrackManagerProps> = ({
  tracks = [],
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const formatDuration = (ms: number | undefined): string => {
    if (!ms || isNaN(Number(ms))) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getArtistImage = (artist: any): string => {
    return artist.profile_image_url || 
           artist.profile_image_small_url || 
           artist.profile_image_large_url || 
           '/images/placeholder-artist.jpg';
  };

  if (!tracks.length) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Release</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Release Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body1" sx={{ py: 2 }}>
                  No tracks available
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Sort tracks by release date (newest first)
  const sortedTracks = [...tracks].sort((a, b) => {
    const dateA = a.release?.release_date ? new Date(a.release.release_date).getTime() : 0;
    const dateB = b.release?.release_date ? new Date(b.release.release_date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell>Release</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Release Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  {track.release?.artwork_url && (
                    <img
                      src={track.release.artwork_url}
                      alt={track.title}
                      style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                    />
                  )}
                  <Typography variant="body1">{track.title}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
                  {track.artists?.map((artist) => (
                    <Box key={artist.id} display="flex" alignItems="center" gap={1}>
                      <Avatar 
                        src={getArtistImage(artist)} 
                        alt={artist.name}
                        sx={{ width: 30, height: 30 }}
                      />
                      <Typography variant="body2">{artist.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </TableCell>
              <TableCell>
                {track.release?.title}
              </TableCell>
              <TableCell>
                {formatDuration(track.duration)}
              </TableCell>
              <TableCell>
                {track.release?.release_date ? formatDate(track.release.release_date) : ''}
              </TableCell>
              <TableCell align="right">
                <IconButton 
                  size="small" 
                  onClick={() => track.spotify_url && window.open(track.spotify_url, '_blank')}
                  disabled={!track.spotify_url}
                >
                  <PlayIcon />
                </IconButton>
                <IconButton size="small" onClick={() => onEdit(track)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(track.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrackManager;
