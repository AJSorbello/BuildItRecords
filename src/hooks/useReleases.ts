import { useState, useEffect } from 'react';
import { spotifyService } from '../services/SpotifyService';
import { Release } from '../types/release';
import { SpotifyTrack } from '../types/spotify';
import { SPOTIFY_CONFIG } from '../config/spotify';

// Replace these with your actual Spotify playlist IDs
// const SPOTIFY_PLAYLIST_IDS = {
//   records: '37i9dQZF1DX0XUsuxWHRQd', // Example playlist ID - replace with your actual playlist ID
//   tech: '37i9dQZF1DX4dyzvuaRJ0n',    // Example playlist ID - replace with your actual playlist ID
//   deep: '37i9dQZF1DX8Uebhn9wzrS',    // Example playlist ID - replace with your actual playlist ID
// } as const;

// const BEATPORT_URLS = {
//   records: 'https://www.beatport.com/label/build-it-records/89999',
//   tech: 'https://www.beatport.com/label/build-it-tech/90000',
//   deep: 'https://www.beatport.com/label/build-it-deep/90001',
// } as const;

// const SOUNDCLOUD_URLS = {
//   records: 'https://soundcloud.com/builditrecords',
//   tech: 'https://soundcloud.com/buildittech',
//   deep: 'https://soundcloud.com/builditdeep',
// } as const;

type LabelId = keyof typeof SPOTIFY_CONFIG.PLAYLISTS;

const useReleases = (labelId: LabelId) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const convertSpotifyTrackToRelease = (spotifyTrack: SpotifyTrack): Release => ({
    id: spotifyTrack.id,
    title: spotifyTrack.trackTitle,
    artist: spotifyTrack.artist,
    artwork: spotifyTrack.albumCover,
    releaseDate: spotifyTrack.album.releaseDate,
    spotifyUrl: spotifyTrack.spotifyUrl,
    beatportUrl: SPOTIFY_CONFIG.URLS[labelId].beatport,
    soundcloudUrl: SPOTIFY_CONFIG.URLS[labelId].soundcloud,
    label: labelId,
    tracks: [{
      id: spotifyTrack.id,
      title: spotifyTrack.trackTitle,
      artist: spotifyTrack.artist,
      duration: spotifyTrack.duration || '0',
      previewUrl: spotifyTrack.previewUrl,
      spotifyId: spotifyTrack.id
    }]
  });

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const tracks = await spotifyService.getLabelReleases(SPOTIFY_CONFIG.PLAYLISTS[labelId].id);
        const formattedReleases = tracks.map(convertSpotifyTrackToRelease);
        
        setReleases(formattedReleases);
      } catch (error) {
        console.error('Error fetching releases:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, [labelId]);

  return {
    releases,
    isLoading,
    error,
    refetch: async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const tracks = await spotifyService.getLabelReleases(SPOTIFY_CONFIG.PLAYLISTS[labelId].id);
        const formattedReleases = tracks.map(convertSpotifyTrackToRelease);
        
        setReleases(formattedReleases);
      } catch (error) {
        console.error('Error fetching releases:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
  };
};

export default useReleases;
