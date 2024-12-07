import { useState, useEffect } from 'react';
import { spotifyService } from '../services/SpotifyService';
import { Release } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

const SPOTIFY_IDS = {
  records: 'builditrecords',
  tech: 'buildittech',
  deep: 'builditdeep',
} as const;

const BEATPORT_URLS = {
  records: 'https://www.beatport.com/label/build-it-records/89999',
  tech: 'https://www.beatport.com/label/build-it-tech/90000',
  deep: 'https://www.beatport.com/label/build-it-deep/90001',
} as const;

const SOUNDCLOUD_URLS = {
  records: 'https://soundcloud.com/builditrecords',
  tech: 'https://soundcloud.com/buildittech',
  deep: 'https://soundcloud.com/builditdeep',
} as const;

type LabelId = keyof typeof SPOTIFY_IDS;

const labelIdToRecordLabel = (labelId: LabelId): RecordLabel => {
  switch (labelId) {
    case 'records':
      return RECORD_LABELS.RECORDS;
    case 'tech':
      return RECORD_LABELS.TECH;
    case 'deep':
      return RECORD_LABELS.DEEP;
  }
};

const useReleases = (labelId: LabelId) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const convertSpotifyToRelease = (spotifyRelease: any): Release => ({
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.artists[0]?.name || 'Unknown Artist',
    artwork: spotifyRelease.images[0]?.url || '',
    releaseDate: spotifyRelease.release_date,
    spotifyUrl: spotifyRelease.external_urls.spotify,
    beatportUrl: BEATPORT_URLS[labelId],
    soundcloudUrl: SOUNDCLOUD_URLS[labelId],
    label: labelIdToRecordLabel(labelId),
    tracks: spotifyRelease.tracks.items.map((track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      duration_ms: number;
      preview_url: string | null;
    }) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      duration: track.duration_ms,
      previewUrl: track.preview_url,
    })),
  });

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const allReleases = await spotifyService.getLabelReleases(SPOTIFY_IDS[labelId]);
        const formattedReleases = allReleases.map(convertSpotifyToRelease);
        
        setReleases(formattedReleases);
      } catch (error) {
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
        
        const allReleases = await spotifyService.getLabelReleases(SPOTIFY_IDS[labelId]);
        const formattedReleases = allReleases.map(convertSpotifyToRelease);
        
        setReleases(formattedReleases);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
  };
};

export default useReleases;
