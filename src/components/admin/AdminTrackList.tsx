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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Track } from '../../types/track';

interface AdminTrackListProps {
  tracks: Track[];
  onTrackEdit: (track: Track) => void;
}

const AdminTrackList: React.FC<AdminTrackListProps> = ({
  tracks,
  onTrackEdit,
}) => {
  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  if (!tracks.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
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
            <TableCell>Title</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell>Album</TableCell>
            <TableCell>Release Date</TableCell>
            <TableCell>Label</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell>{track.title}</TableCell>
              <TableCell>
                {track.artists.map((artist) => artist.name).join(', ')}
              </TableCell>
              <TableCell>{track.album?.name || 'N/A'}</TableCell>
              <TableCell>{formatDate(track.releaseDate)}</TableCell>
              <TableCell>{track.label || 'N/A'}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => onTrackEdit(track)}
                  size="small"
                  title="Edit track"
                >
                  <EditIcon />
                </IconButton>
                {track.spotifyUrl && (
                  <IconButton
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    title="Open in Spotify"
                  >
                    <OpenInNewIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminTrackList;
