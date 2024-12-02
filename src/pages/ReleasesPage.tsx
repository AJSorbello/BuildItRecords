import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Link, styled } from '@mui/material';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa';
import { SiBeatport } from 'react-icons/si';
import { Track } from '../types/track';
import { RECORD_LABELS } from '../constants/labels';
import { resetData, getData } from '../utils/dataInitializer';
import { LabelKey } from '../types/labels';
import { SpotifyService } from '../services/SpotifyService'; // Fix import path with correct case

interface Release {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  releaseDate: string;
  label: string;
  beatportUrl?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
  plays: number;
}

interface StoredTrack extends Track {
  beatportUrl?: string;
  soundcloudUrl?: string;
}

interface ReleasesPageProps {
  label: LabelKey;
}

const FeaturedReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 800,
  margin: '0 auto',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const ReleaseCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'transform 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const TopListenCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  marginBottom: '8px',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const IconLink = styled(Link)({
  color: '#FFFFFF',
  marginRight: '16px',
  '&:hover': {
    color: '#02FF95',
  },
});

const mockData = [
  {
    id: '1',
    trackTitle: 'Track 1',
    artist: 'Artist 1',
    recordLabel: 'Build It Records',
    albumCover: 'https://via.placeholder.com/300',
    spotifyUrl: 'https://open.spotify.com/track/1',
    beatportUrl: 'https://www.beatport.com/track/1',
    soundcloudUrl: 'https://soundcloud.com/artist1/track1',
  },
  {
    id: '2',
    trackTitle: 'Track 2',
    artist: 'Artist 2',
    recordLabel: 'Build It Tech',
    albumCover: 'https://via.placeholder.com/300',
    spotifyUrl: 'https://open.spotify.com/track/2',
    beatportUrl: 'https://www.beatport.com/track/2',
    soundcloudUrl: 'https://soundcloud.com/artist2/track2',
  },
  {
    id: '3',
    trackTitle: 'Track 3',
    artist: 'Artist 3',
    recordLabel: 'Build It Deep',
    albumCover: 'https://via.placeholder.com/300',
    spotifyUrl: 'https://open.spotify.com/track/3',
    beatportUrl: 'https://www.beatport.com/track/3',
    soundcloudUrl: 'https://soundcloud.com/artist3/track3',
  },
];

const getReleases = (label: LabelKey): Release[] => {
  const storedTracks = getData().tracks;
  if (!storedTracks) return [];

  try {
    const allTracks = storedTracks as StoredTrack[];
    console.log('All tracks:', allTracks);

    return allTracks
      .filter((track): track is StoredTrack => {
        if (!track || typeof track !== 'object') return false;
        const matches = track.recordLabel === RECORD_LABELS[label];
        console.log('Track label match?', {
          trackLabel: track.recordLabel,
          requiredLabel: RECORD_LABELS[label],
          matches
        });
        return matches;
      })
      .map((track): Release | null => {
        if (!track.id || !track.trackTitle || !track.artist || !track.recordLabel) {
          console.error('Missing required fields for track:', track);
          return null;
        }

        console.log('Converting track to release:', track);

        // Ensure we have an album cover
        const artwork = track.albumCover && track.albumCover !== 'https://via.placeholder.com/300'
          ? track.albumCover
          : 'https://via.placeholder.com/300';

        console.log('Using artwork:', artwork);

        const release = {
          id: track.id,
          title: track.trackTitle,
          artist: track.artist,
          artwork,
          releaseDate: new Date().toISOString().split('T')[0], 
          label: track.recordLabel,
          beatportUrl: track.beatportUrl,
          spotifyUrl: track.spotifyUrl,
          soundcloudUrl: track.soundcloudUrl,
          plays: 0 
        };

        console.log('Created release:', release);

        return release;
      })
      .filter((track): track is Release => track !== null);
  } catch (error) {
    console.error('Error loading releases:', error);
    return [];
  }
};

const ReleasesPage: React.FC<ReleasesPageProps> = ({ label }) => {
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    const allTracks = getData().tracks;
    console.log('All tracks:', allTracks);
    
    // First, filter tracks by label
    const filteredTracks = allTracks.filter((track: Track) => {
      const matches = track.recordLabel === RECORD_LABELS[label];
      console.log('Track label match?', {
        trackLabel: track.recordLabel,
        requiredLabel: RECORD_LABELS[label],
        matches
      });
      return matches;
    });

    // Then, convert tracks to releases, fetching artwork if needed
    const convertTracksToReleases = async () => {
      const releases = await Promise.all(filteredTracks.map(async (track: Track): Promise<Release | null> => {
        if (!track.id || !track.trackTitle || !track.artist || !track.recordLabel) {
          console.error('Missing required fields for track:', track);
          return null;
        }

        console.log('Converting track to release:', track);

        // If no album cover and we have a Spotify URL, try to fetch it
        let artwork = track.albumCover;
        if ((!artwork || artwork === 'https://via.placeholder.com/300') && track.spotifyUrl) {
          try {
            console.log('Fetching artwork from Spotify...');
            const spotifyService = SpotifyService.getInstance();
            const trackDetails = await spotifyService.getTrackDetailsByUrl(track.spotifyUrl);
            if (trackDetails?.albumCover) {
              artwork = trackDetails.albumCover;
              console.log('Got artwork from Spotify:', artwork);
              
              // Update the track in localStorage with the new artwork
              const updatedTracks = allTracks.map(t => 
                t.id === track.id ? { ...t, albumCover: artwork } : t
              );
              localStorage.setItem('tracks', JSON.stringify(updatedTracks));
            }
          } catch (error) {
            console.error('Error fetching artwork from Spotify:', error);
          }
        }

        // Use placeholder if still no artwork
        if (!artwork) {
          artwork = 'https://via.placeholder.com/300';
        }

        console.log('Using artwork:', artwork);

        const release: Release = {
          id: track.id,
          title: track.trackTitle,
          artist: track.artist,
          artwork,
          releaseDate: new Date().toISOString().split('T')[0],
          label: track.recordLabel,
          beatportUrl: track.beatportUrl,
          spotifyUrl: track.spotifyUrl,
          soundcloudUrl: track.soundcloudUrl,
          plays: 0
        };

        console.log('Created release:', release);
        return release;
      }));

      return releases.filter((release): release is Release => release !== null);
    };

    // Execute the conversion and update state
    convertTracksToReleases().then(setReleases);
  }, [label]);

  const featuredRelease = releases[0];
  const pastReleases = releases.slice(1);

  const topListened = releases.length > 0 
    ? [...releases].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10)
    : [];

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', textAlign: 'center' }}>
        {RECORD_LABELS[label]}
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}>
        {RECORD_LABELS[label]}
      </Typography>

      <Grid container spacing={4}>
        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          {/* Featured Release */}
          {featuredRelease ? (
            <Box mb={8}>
              <>
                <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                  Latest Release
                </Typography>
                <FeaturedReleaseCard>
                  <CardMedia
                    component="img"
                    sx={{
                      width: '100%',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                    image={featuredRelease.artwork || 'https://via.placeholder.com/300'}
                    alt={featuredRelease.title}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      console.error('Error loading image:', e);
                      e.currentTarget.src = 'https://via.placeholder.com/300';
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Typography variant="h4" component="div" sx={{ color: 'text.primary', mb: 1 }}>
                      {featuredRelease.title}
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                      {featuredRelease.artist}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" color="text.secondary">
                        {featuredRelease.releaseDate}
                      </Typography>
                      <Box mt={2}>
                        {featuredRelease.beatportUrl && (
                          <IconLink href={featuredRelease.beatportUrl} target="_blank">
                            <SiBeatport size={24} />
                          </IconLink>
                        )}
                        {featuredRelease.spotifyUrl && (
                          <IconLink href={featuredRelease.spotifyUrl} target="_blank">
                            <FaSpotify size={24} />
                          </IconLink>
                        )}
                        {featuredRelease.soundcloudUrl && (
                          <IconLink href={featuredRelease.soundcloudUrl} target="_blank">
                            <FaSoundcloud size={24} />
                          </IconLink>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </FeaturedReleaseCard>
              </>
            </Box>
          ) : (
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 4 }}>
              No releases yet
            </Typography>
          )}

          {/* Past Releases Grid */}
          {pastReleases.length > 0 && (
            <Box>
              <>
                <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                  Past Releases
                </Typography>
                <Grid container spacing={3}>
                  {pastReleases.map((release) => (
                    <Grid item xs={12} sm={6} md={4} key={release.id}>
                      <ReleaseCard>
                        <CardMedia
                          component="img"
                          sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            objectFit: 'cover',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)'
                          }}
                          image={release.artwork || 'https://via.placeholder.com/300'}
                          alt={release.title}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            console.error('Error loading image:', e);
                            e.currentTarget.src = 'https://via.placeholder.com/300';
                          }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                            {release.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {release.artist}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {release.releaseDate}
                            </Typography>
                            <Box mt={1}>
                              {release.beatportUrl && (
                                <IconLink href={release.beatportUrl} target="_blank">
                                  <SiBeatport size={20} />
                                </IconLink>
                              )}
                              {release.spotifyUrl && (
                                <IconLink href={release.spotifyUrl} target="_blank">
                                  <FaSpotify size={20} />
                                </IconLink>
                              )}
                              {release.soundcloudUrl && (
                                <IconLink href={release.soundcloudUrl} target="_blank">
                                  <FaSoundcloud size={20} />
                                </IconLink>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </ReleaseCard>
                    </Grid>
                  ))}
                </Grid>
              </>
            </Box>
          )}
        </Grid>

        {/* Right Sidebar - Top 10 Most Listened */}
        <Grid item xs={12} md={3}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: '24px' } }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Top 10 Most Listened
            </Typography>
            {topListened.length > 0 ? (
              topListened.map((track, index) => (
                <TopListenCard key={track.id}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'text.secondary', mr: 2, minWidth: '28px' }}>
                        {index + 1}
                      </Typography>
                      <Box>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {track.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {track.artist}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {track.plays?.toLocaleString()} plays
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </TopListenCard>
              ))
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center' }}>
                No tracks to display
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReleasesPage;
