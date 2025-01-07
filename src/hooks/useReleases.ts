import { useState, useEffect } from 'react';
import type { Release } from '../types/release';
import { RECORD_LABELS } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';
import { Track } from '../types/track';
import { Artist } from '../types/artist';

export interface UseReleasesProps {
  label: string;
}

export const useReleases = ({ label }: UseReleasesProps) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!label) {
          setReleases([]);
          setTopTracks([]);
          return;
        }

        // Get the label object from the constant
        const recordLabel = RECORD_LABELS[label];
        if (!recordLabel) {
          throw new Error(`Invalid label: ${label}`);
        }

        // Fetch regular releases
        const response = await databaseService.getReleasesByLabelId(label);
        console.log('Hook response:', response);
        const releasesArray = Array.isArray(response.releases) ? response.releases : [];
        setReleases(releasesArray);

        // Fetch top tracks by popularity
        const popularTracks = await databaseService.getTracksByLabel(recordLabel, 'popularity');
        if (Array.isArray(popularTracks)) {
          setTopTracks(popularTracks.slice(0, 10)); // Keep only top 10
        } else {
          setTopTracks([]);
        }

        setError(null);
      } catch (err) {
        console.error(`Error fetching data for label ${label}:`, err);
        setError(err instanceof Error ? err.message : `Failed to load data for label ${label}`);
        setReleases([]);
        setTopTracks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [label]);

  const addReleases = (newTracks: Track[]) => {
    setReleases(prevReleases => {
      const releasesFromTracks = newTracks.map(track => ({
        id: track.id,
        name: track.name,
        type: 'single' as const,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          external_urls: { spotify: artist.external_urls?.spotify }
        })) as Artist[],
        artwork_url: track.album?.artwork_url,
        release_date: track.album?.release_date,
        total_tracks: 1,
        tracks: [track]
      }));
      return [...prevReleases, ...releasesFromTracks];
    });
  };

  return {
    releases,
    topTracks,
    loading,
    error,
    addReleases
  };
};

export default useReleases;
