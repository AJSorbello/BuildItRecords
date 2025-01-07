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
  tracks: Track[];
  onEditTrack: (track: Track) => void;
  onDeleteTrack: (trackId: string) => void;
}

const TrackManager: React.FC<TrackManagerProps> = ({
  tracks,
  onEditTrack,
  onDeleteTrack,
}) => {
  const getArtistNames = (track: Track): string => {
    return track.artists.map(artist => artist.name).join(', ');
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

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
                  {track.album.images[0] && (
                    <img
                      src={track.album.images[0].url}
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
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="a"
                      href={track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'none' }}
                    >
                      Open in Spotify
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{getArtistNames(track)}</TableCell>
              <TableCell>{track.album.name}</TableCell>
              <TableCell>{formatDuration(track.duration_ms)}</TableCell>
              <TableCell>{track.album.release_date}</TableCell>
              <TableCell>
                <IconButton
                  onClick={() => onEditTrack(track)}
                  size="small"
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDeleteTrack(track.id)}
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
