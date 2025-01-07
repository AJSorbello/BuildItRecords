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
  Box
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Track } from '../../types/track';

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
  const getArtistNames = (track: Track): string => {
    return track.artists?.map(artist => artist.name).join(', ') || '';
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (!tracks || tracks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No tracks available
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Track Name</TableCell>
            <TableCell>Artists</TableCell>
            <TableCell>Album</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Release Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  {track.album?.artwork_url && (
                    <img
                      src={track.album.artwork_url}
                      alt={track.album.name}
                      style={{
                        width: 40,
                        height: 40,
                        marginRight: 10,
                        borderRadius: 4
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="body1">{track.name}</Typography>
                    {track.spotify_url && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="a"
                        href={track.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textDecoration: 'none' }}
                      >
                        Open in Spotify
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{getArtistNames(track)}</TableCell>
              <TableCell>{track.album?.name}</TableCell>
              <TableCell>{formatDuration(track.duration_ms || 0)}</TableCell>
              <TableCell>{track.album?.release_date}</TableCell>
              <TableCell>
                <IconButton
                  onClick={() => onEdit(track)}
                  size="small"
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(track.id)}
                  size="small"
                  color="error"
                >
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
