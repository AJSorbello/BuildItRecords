import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface Artist {
  fullName: string;
  country: string;
  province: string;
}

interface SocialLinks {
  facebook: string;
  twitter: string;
  soundcloud: string;
  spotify: string;
  appleMusic: string;
}

interface DemoSubmission {
  label: string;
  artists: Artist[];
  artistName: string;
  trackTitles: string[];
  soundcloudLink: string;
  socialLinks: SocialLinks;
}

const DemoSubmissionForm = () => {
  const [formData, setFormData] = useState<DemoSubmission>({
    label: '',
    artists: [{ fullName: '', country: '', province: '' }],
    artistName: '',
    trackTitles: [''],
    soundcloudLink: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      soundcloud: '',
      spotify: '',
      appleMusic: '',
    },
  });

  const handleAddArtist = () => {
    setFormData({
      ...formData,
      artists: [...formData.artists, { fullName: '', country: '', province: '' }],
    });
  };

  const handleRemoveArtist = (index: number) => {
    const newArtists = formData.artists.filter((_, i) => i !== index);
    setFormData({ ...formData, artists: newArtists });
  };

  const handleAddTrack = () => {
    setFormData({
      ...formData,
      trackTitles: [...formData.trackTitles, ''],
    });
  };

  const handleRemoveTrack = (index: number) => {
    const newTracks = formData.trackTitles.filter((_, i) => i !== index);
    setFormData({ ...formData, trackTitles: newTracks });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Handle form submission
    console.log(formData);
  };

  return (
    <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <Typography variant="h5" gutterBottom>
        Demo Submission
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Label</InputLabel>
              <Select
                value={formData.label}
                label="Label"
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              >
                <MenuItem value="records">Build It Records</MenuItem>
                <MenuItem value="tech">Build It Tech</MenuItem>
                <MenuItem value="deep">Build It Deep</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.artists.map((artist, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Artist {index + 1}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={artist.fullName}
                      onChange={(e) => {
                        const newArtists = [...formData.artists];
                        newArtists[index].fullName = e.target.value;
                        setFormData({ ...formData, artists: newArtists });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={artist.country}
                      onChange={(e) => {
                        const newArtists = [...formData.artists];
                        newArtists[index].country = e.target.value;
                        setFormData({ ...formData, artists: newArtists });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Province"
                      value={artist.province}
                      onChange={(e) => {
                        const newArtists = [...formData.artists];
                        newArtists[index].province = e.target.value;
                        setFormData({ ...formData, artists: newArtists });
                      }}
                    />
                  </Grid>
                  {index > 0 && (
                    <Grid item xs={12}>
                      <IconButton onClick={() => handleRemoveArtist(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button variant="outlined" onClick={handleAddArtist}>
              Add Additional Artist
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Artist/Project Name"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
            />
          </Grid>

          {formData.trackTitles.map((track, index) => (
            <Grid item xs={12} key={index}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label={`Track Title ${index + 1}`}
                  value={track}
                  onChange={(e) => {
                    const newTracks = [...formData.trackTitles];
                    newTracks[index] = e.target.value;
                    setFormData({ ...formData, trackTitles: newTracks });
                  }}
                />
                {index > 0 && (
                  <IconButton onClick={() => handleRemoveTrack(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button variant="outlined" onClick={handleAddTrack}>
              Add Track Title
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Soundcloud Private Link"
              value={formData.soundcloudLink}
              onChange={(e) => setFormData({ ...formData, soundcloudLink: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Social Media Links
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Facebook"
              value={formData.socialLinks.facebook}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Twitter/X"
              value={formData.socialLinks.twitter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Soundcloud"
              value={formData.socialLinks.soundcloud}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, soundcloud: e.target.value },
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Spotify"
              value={formData.socialLinks.spotify}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, spotify: e.target.value },
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apple Music"
              value={formData.socialLinks.appleMusic}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, appleMusic: e.target.value },
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit">
              Submit Demo
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default DemoSubmissionForm;
