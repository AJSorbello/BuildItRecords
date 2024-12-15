import React, { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { RECORD_LABELS } from '../../constants/labels';
import { Track } from '../../types/track';
import TrackList from '../../components/TrackList';
import PageLayout from '../../components/PageLayout';
import { spotifyService } from '../../services/SpotifyService';
import { getData } from '../../utils/dataInitializer';

const RecordsHome = () => {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      // Get tracks directly from getData like the releases page does
      const data = getData();
      const labelTracks = data.tracks.filter(track => 
        track.recordLabel.toLowerCase() === RECORD_LABELS.RECORDS.toLowerCase()
      );
      console.log('All tracks from Records label:', labelTracks);
      
      // Sort tracks by release date (newest first)
      const sortedTracks = labelTracks.sort((a, b) => {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB.getTime() - dateA.getTime();
      });
      console.log('Sorted tracks:', sortedTracks.map(t => ({ title: t.trackTitle, date: t.releaseDate })));

      // Get the latest release date
      const latestDate = sortedTracks[0]?.releaseDate;
      console.log('Latest release date:', latestDate);
      
      // Get all tracks from the latest release date
      const latestTracks = sortedTracks.filter(track => 
        track.releaseDate === latestDate
      );
      console.log('Tracks from latest release date:', latestTracks.map(t => t.trackTitle));

      // Group tracks by base title (removing the remix/version part)
      const getBaseTitle = (title: string) => {
        return title.split('-')[0].trim();
      };

      const baseTitle = getBaseTitle(latestTracks[0]?.trackTitle || '');
      console.log('Base title:', baseTitle);
      
      const releaseTracks = sortedTracks.filter(track => 
        getBaseTitle(track.trackTitle) === baseTitle
      );
      console.log('All versions of the release:', releaseTracks.map(t => t.trackTitle));

      if (releaseTracks.length > 0) {
        try {
          const tracksWithDetails = await Promise.all(
            releaseTracks.map(async (track) => {
              try {
                const spotifyDetails = await spotifyService.getTrackDetailsByUrl(track.spotifyUrl);
                return spotifyDetails ? {
                  ...track,
                  albumCover: spotifyDetails.albumCover,
                  previewUrl: spotifyDetails.previewUrl
                } : track;
              } catch (error) {
                console.error('Error fetching Spotify details:', error);
                return track;
              }
            })
          );
          console.log('Final tracks with details:', tracksWithDetails.map(t => t.trackTitle));
          setFeaturedTracks(tracksWithDetails);
        } catch (error) {
          console.error('Error fetching Spotify details:', error);
          setFeaturedTracks(releaseTracks);
        }
      }
    };

    fetchFeaturedTracks();
  }, []);

  return (
    <PageLayout label="records">
      <Container 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '1000px !important',
          pl: '0 !important',
          pr: '24px !important'
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '900px',
            mt: 1
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: '#FFFFFF',
              mb: 4,
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            Build It Records
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#AAAAAA',
              mb: 6,
              textAlign: 'center'
            }}
          >
            Underground electronic music for the discerning listener.
          </Typography>

          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              color: '#FFFFFF',
              mb: 4,
              fontWeight: 'bold'
            }}
          >
            {featuredTracks.length > 1 ? 'Featured EP' : 'Featured Release'}
          </Typography>

          <TrackList tracks={featuredTracks} />
        </Box>
      </Container>
    </PageLayout>
  );
};

export default RecordsHome;
