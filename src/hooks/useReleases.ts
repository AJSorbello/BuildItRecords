import { useState, useEffect } from 'react';
import type { Release } from '../types/release';
import { RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Track } from '../types/track';

export interface UseReleasesProps {
  label: string;
}

export const useReleases = ({ label }: UseReleasesProps) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        if (!label) {
          setReleases([]);
          return;
        }
        const response = await databaseService.getReleasesByLabelId(label);
        console.log('Hook response:', response);
        const releasesArray = Array.isArray(response.releases) ? response.releases : [];
        setReleases(releasesArray);
        setError(null);
      } catch (err) {
        console.error(`Error fetching releases for label ${label}:`, err);
        setError(err instanceof Error ? err.message : `Failed to load releases for label ${label}`);
        setReleases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [label]);

  const addReleases = (newTracks: Track[]) => {
    setReleases(prevReleases => {
      const releasesFromTracks: Release[] = newTracks.map(track => ({
        id: track.id,
        name: track.name,
        type: 'single',
        artists: track.artists,
        artwork_url: track.album?.artwork_url,
        release_date: track.releaseDate,
        total_tracks: 1,
        tracks: [track]
      }));
      return [...prevReleases, ...releasesFromTracks];
    });
  };

  return {
    releases,
    setReleases,
    loading,
    setLoading,
    error,
    setError,
    addReleases
  };
};

export default useReleases;
