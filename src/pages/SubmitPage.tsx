import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  styled
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageLayout from '../components/PageLayout';

const StyledPaper = styled(Paper)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  padding: '24px',
  marginBottom: '24px',
});

const StyledForm = styled('form')({
  width: '100%',
  '& .MuiTextField-root': {
    marginBottom: '16px',
  },
});

interface Artist {
  fullName: string;
  artistName: string;
}

interface FormData {
  label: string;
  artists: Artist[];
  country: string;
  province: string;
  trackTitles: string;
  soundcloudLink: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    soundcloud: string;
    spotify: string;
    appleMusic: string;
  };
}

const initialFormData: FormData = {
  label: 'records',
  artists: [{ fullName: '', artistName: '' }],
  country: '',
  province: '',
  trackTitles: '',
  soundcloudLink: '',
  socialMedia: {
    facebook: '',
    twitter: '',
    soundcloud: '',
    spotify: '',
    appleMusic: '',
  },
};

const SubmitPage = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia.')) {
      const socialMediaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialMediaField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleArtistChange = (index: number, field: keyof Artist, value: string) => {
    setFormData(prev => {
      const newArtists = [...prev.artists];
      newArtists[index] = { ...newArtists[index], [field]: value };
      return { ...prev, artists: newArtists };
    });
  };

  const addArtist = () => {
    setFormData(prev => ({
      ...prev,
      artists: [...prev.artists, { fullName: '', artistName: '' }]
    }));
  };

  const removeArtist = (index: number) => {
    if (formData.artists.length > 1) {
      setFormData(prev => ({
        ...prev,
        artists: prev.artists.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your submission! We will review your demo and get back to you soon.');
    setFormData(initialFormData);
  };

  return (
    <PageLayout label="records">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
          Submit Your Demo
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
          Share Your Music with Build It Records
        </Typography>

        <StyledPaper>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            Please fill out the form below to submit your demo. We listen to every submission and will contact you if we&apos;re interested in releasing your music.
          </Typography>

          <StyledForm onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Label</InputLabel>
                  <Select
                    name="label"
                    value={formData.label}
                    onChange={handleSelectChange}
                    label="Label"
                    required
                  >
                    <MenuItem value="records">Build It Records</MenuItem>
                    <MenuItem value="tech">Build It Tech</MenuItem>
                    <MenuItem value="deep">Build It Deep</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.artists.map((artist, index) => (
                <Grid item xs={12} key={index} container spacing={2}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      required
                      fullWidth
                      label="Full Name"
                      value={artist.fullName}
                      onChange={(e) => handleArtistChange(index, 'fullName', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      required
                      fullWidth
                      label="Artist Name"
                      value={artist.artistName}
                      onChange={(e) => handleArtistChange(index, 'artistName', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    {index > 0 && (
                      <IconButton onClick={() => removeArtist(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    )}
                    {index === formData.artists.length - 1 && (
                      <IconButton onClick={addArtist} color="primary">
                        <AddIcon />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Province/State"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Track Titles (separate multiple tracks with commas)"
                  name="trackTitles"
                  value={formData.trackTitles}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="SoundCloud Private Link"
                  name="soundcloudLink"
                  value={formData.soundcloudLink}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://soundcloud.com/your-track/private"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Social Media Links
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://facebook.com/your-profile"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="X (Twitter)"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://x.com/your-profile"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SoundCloud Profile"
                  name="socialMedia.soundcloud"
                  value={formData.socialMedia.soundcloud}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://soundcloud.com/your-profile"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Spotify Artist"
                  name="socialMedia.spotify"
                  value={formData.socialMedia.spotify}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://open.spotify.com/artist/your-id"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apple Music Artist"
                  name="socialMedia.appleMusic"
                  value={formData.socialMedia.appleMusic}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://music.apple.com/artist/your-id"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 2,
                    backgroundColor: '#02FF95',
                    color: '#000000',
                    '&:hover': {
                      backgroundColor: '#00CC76',
                    },
                  }}
                >
                  Submit Demo
                </Button>
              </Grid>
            </Grid>
          </StyledForm>
        </StyledPaper>

        <StyledPaper>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
            Submission Guidelines
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            • Only submit unreleased, original material<br />
            • Make sure your SoundCloud links are private and accessible<br />
            • We accept all forms of House Music, Tech House, and Deep House<br />
            • Please allow 2-3 weeks for a response<br />
            • Due to the high volume of submissions, we can only respond to tracks we&apos;re interested in releasing
          </Typography>
        </StyledPaper>
      </Box>
    </PageLayout>
  );
};

export default SubmitPage;
