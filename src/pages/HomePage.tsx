import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { LabelKey } from '../types/labels';
import { Release } from '../types/release';
import { LoadingSpinner, ErrorMessage } from '../components';
import ReleaseCard from '../components/ReleaseCard';

interface HomePageProps {
  label: LabelKey;
}

const HomePage: React.FC<HomePageProps> = ({ label }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredReleases, setFeaturedReleases] = useState<Release[]>([]);

  useEffect(() => {
    const fetchFeaturedReleases = async () => {
      try {
        const response = await fetch(`/api/releases/featured?label=${label.toLowerCase()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch featured releases');
        }
        const data = await response.json();
        setFeaturedReleases(data.releases);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedReleases();
  }, [label]);

  const getLabelContent = () => {
    switch (label) {
      case 'TECH':
        return {
          title: 'Build It Tech',
          description: 'Pushing the boundaries of modern techno music.',
        };
      case 'DEEP':
        return {
          title: 'Build It Deep',
          description: 'Exploring the depths of deep house and melodic techno.',
        };
      default:
        return {
          title: 'Build It Records',
          description: 'Underground electronic music for the discerning listener.',
        };
    }
  };

  const content = getLabelContent();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        {content.title}
      </Typography>
      <Typography variant="h5" sx={{ color: 'text.secondary', mb: 6 }}>
        {content.description}
      </Typography>

      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
        Featured Releases
      </Typography>

      <Grid container spacing={4}>
        {featuredReleases.map((release) => (
          <Grid item xs={12} sm={6} md={4} key={release.id}>
            <ReleaseCard release={release} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
