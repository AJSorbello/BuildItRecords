import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, styled } from '@mui/material';
import PageLayout from '../components/PageLayout';
import { useParams } from 'react-router-dom';
import { Release, parseCSV, filterByLabel } from '../utils/csvParser';

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const ReleasesPage = () => {
  const { label } = useParams<{ label: string }>();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReleases = async () => {
      try {
        const allReleases = await parseCSV('');  // The path is now handled in parseCSV
        const filteredReleases = filterByLabel(allReleases, label || 'records')
          .sort((a, b) => a.artist.localeCompare(b.artist));
        setReleases(filteredReleases);
      } catch (error) {
        console.error('Error loading releases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReleases();
  }, [label]);

  if (loading) {
    return (
      <PageLayout label={label || 'records'}>
        <Typography>Loading releases...</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout label={label || 'records'}>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
          Releases ({releases.length})
        </Typography>
        <Grid container spacing={3}>
          {releases.map((release, index) => (
            <Grid item xs={12} sm={6} md={4} key={`${release.artist}-${release.title}-${index}`}>
              <ReleaseCard>
                <CardContent>
                  <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
                    {release.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {release.artist}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {release.catalogNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {release.genre} {release.style ? `- ${release.style}` : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {release.format}
                    </Typography>
                    {release.releaseDate && (
                      <Typography variant="body2" color="text.secondary">
                        Released: {release.releaseDate}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </ReleaseCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ReleasesPage;
