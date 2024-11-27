import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { ErrorBoundary } from '../components/ErrorBoundary';
import styled from '@mui/material/styles/styled';

const StyledCard = React.memo(styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  marginBottom: '24px',
}));
StyledCard.displayName = 'StyledCard';

const StyledButton = React.memo(styled(Button)({
  backgroundColor: '#02FF95',
  color: '#121212',
  '&:hover': {
    backgroundColor: '#00CC76',
  },
}));
StyledButton.displayName = 'StyledButton';

interface Track {
  title: string;
  soundCloudLink: string;
  genre: string;
}

interface Artist {
  name: string;
  fullName: string;
  email: string;
  country: string;
  province: string;
  facebook: string;
  twitter: string;
  instagram: string;
  soundcloud: string;
  spotify: string;
  appleMusic: string;
}

const SubmitPage = () => {
  const { label = 'records' } = useParams<{ label?: string }>();
  const [showSuccess, setShowSuccess] = React.useState(false);

  const {
    formState,
    errors,
    isSubmitting,
    handleArtistChange,
    handleTrackChange,
    addArtist,
    removeArtist,
    addTrack,
    removeTrack,
    handleSubmit
  } = useFormSubmission(() => {
    setShowSuccess(true);
  });

  const { artists, tracks } = formState;

  return (
    <ErrorBoundary>
      <PageLayout label={label as 'records' | 'tech' | 'deep'}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px',
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: '#FFFFFF' }}>
            Submit Demo to Build It {label.charAt(0).toUpperCase() + label.slice(1)}
          </Typography>

          {errors.some(error => error.field === 'submit') && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.find(error => error.field === 'submit')?.message}
            </Alert>
          )}

          {/* Artist Information */}
          <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mt: 4 }}>
            Artist Information
          </Typography>

          {artists.map((artist, index) => (
            <StyledCard key={index}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
                    Artist {index + 1}
                  </Typography>
                  {artists.length > 1 && (
                    <IconButton onClick={() => removeArtist(index)} sx={{ color: '#FFFFFF' }}>
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Artist Name"
                      value={artist.name}
                      onChange={(e) => handleArtistChange(index, 'name', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.name`)}
                      helperText={errors.find(error => error.field === `artists.${index}.name`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={artist.fullName}
                      onChange={(e) => handleArtistChange(index, 'fullName', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.fullName`)}
                      helperText={errors.find(error => error.field === `artists.${index}.fullName`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={artist.email}
                      onChange={(e) => handleArtistChange(index, 'email', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.email`)}
                      helperText={errors.find(error => error.field === `artists.${index}.email`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={artist.country}
                      onChange={(e) => handleArtistChange(index, 'country', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.country`)}
                      helperText={errors.find(error => error.field === `artists.${index}.country`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Province/State"
                      value={artist.province}
                      onChange={(e) => handleArtistChange(index, 'province', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.province`)}
                      helperText={errors.find(error => error.field === `artists.${index}.province`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#FFFFFF' }}>
                      Social Media Links
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Facebook"
                      value={artist.facebook}
                      onChange={(e) => handleArtistChange(index, 'facebook', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.facebook`)}
                      helperText={errors.find(error => error.field === `artists.${index}.facebook`)?.message}
                      variant="outlined"
                      margin="normal"
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Twitter/X"
                      value={artist.twitter}
                      onChange={(e) => handleArtistChange(index, 'twitter', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.twitter`)}
                      helperText={errors.find(error => error.field === `artists.${index}.twitter`)?.message}
                      variant="outlined"
                      margin="normal"
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Instagram"
                      value={artist.instagram}
                      onChange={(e) => handleArtistChange(index, 'instagram', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.instagram`)}
                      helperText={errors.find(error => error.field === `artists.${index}.instagram`)?.message}
                      variant="outlined"
                      margin="normal"
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SoundCloud"
                      value={artist.soundcloud}
                      onChange={(e) => handleArtistChange(index, 'soundcloud', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.soundcloud`)}
                      helperText={errors.find(error => error.field === `artists.${index}.soundcloud`)?.message}
                      variant="outlined"
                      margin="normal"
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Spotify"
                      value={artist.spotify}
                      onChange={(e) => handleArtistChange(index, 'spotify', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.spotify`)}
                      helperText={errors.find(error => error.field === `artists.${index}.spotify`)?.message}
                      variant="outlined"
                      margin="normal"
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Apple Music"
                      value={artist.appleMusic}
                      onChange={(e) => handleArtistChange(index, 'appleMusic', e.target.value)}
                      error={errors.some(error => error.field === `artists.${index}.appleMusic`)}
                      helperText={errors.find(error => error.field === `artists.${index}.appleMusic`)?.message}
                      variant="outlined"
                      margin="normal"
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          ))}

          <Box sx={{ mb: 4 }}>
            <StyledButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addArtist}
            >
              Add Artist
            </StyledButton>
          </Box>

          {/* Track Information */}
          <Typography variant="h5" gutterBottom sx={{ color: '#FFFFFF', mt: 4 }}>
            Track Information
          </Typography>

          {tracks.map((track, index) => (
            <StyledCard key={index}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
                    Track {index + 1}
                  </Typography>
                  {tracks.length > 1 && (
                    <IconButton onClick={() => removeTrack(index)} sx={{ color: '#FFFFFF' }}>
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Track Title"
                      value={track.title}
                      onChange={(e) => handleTrackChange(index, 'title', e.target.value)}
                      error={errors.some(error => error.field === `tracks.${index}.title`)}
                      helperText={errors.find(error => error.field === `tracks.${index}.title`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel id={`genre-label-${index}`} sx={{ color: '#FFFFFF' }}>
                        Genre
                      </InputLabel>
                      <Select
                        labelId={`genre-label-${index}`}
                        value={track.genre}
                        onChange={(e: any) => handleTrackChange(index, 'genre', e.target.value)}
                        label="Genre"
                        sx={{ color: '#FFFFFF' }}
                      >
                        <MenuItem value="house">House</MenuItem>
                        <MenuItem value="techno">Techno</MenuItem>
                        <MenuItem value="deep-house">Deep House</MenuItem>
                        <MenuItem value="tech-house">Tech House</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SoundCloud Private Link"
                      value={track.soundCloudLink}
                      onChange={(e) => handleTrackChange(index, 'soundCloudLink', e.target.value)}
                      error={errors.some(error => error.field === `tracks.${index}.soundCloudLink`)}
                      helperText={errors.find(error => error.field === `tracks.${index}.soundCloudLink`)?.message}
                      variant="outlined"
                      margin="normal"
                      required
                      sx={{ input: { color: '#FFFFFF' }, label: { color: '#FFFFFF' } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          ))}

          <Box sx={{ mb: 4 }}>
            <StyledButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addTrack}
            >
              Add Track
            </StyledButton>
          </Box>

          <Box sx={{ mt: 6, mb: 4 }}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                  Submission Guidelines & Terms
                </Typography>
                <Typography variant="body2" component="div" sx={{ color: '#FFFFFF' }}>
                  • Please allow up to 7 days for us to review your submission<br />
                  • All submissions must be 100% royalty-free or will be rejected immediately<br />
                  • Royalties are split 50/50 between artists and label<br />
                  • Only submit unreleased, original material<br />
                  • We accept demos in WAV format only - premasters no limiters on master/stereo bus<br />
                  • By submitting, you confirm that this is original work and you own all rights
                </Typography>
              </CardContent>
            </StyledCard>
          </Box>

          <Box sx={{ mt: 4 }}>
            <StyledButton 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Demo'}
            </StyledButton>
          </Box>
        </Box>

        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSuccess(false)} severity="success">
            Demo submitted successfully!
          </Alert>
        </Snackbar>
      </PageLayout>
    </ErrorBoundary>
  );
};

export default SubmitPage;
