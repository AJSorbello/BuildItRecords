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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReleases = async (currentPage: number) => {
    try {
      if (!label) return;

      const recordLabel = RECORD_LABELS[label];
      if (!recordLabel) {
        throw new Error(`Invalid label: ${label}`);
      }

      setLoadingMore(true);
      console.log('Fetching releases for page:', currentPage);
      const response = await databaseService.getReleasesByLabelId(label, currentPage);
      console.log('Response:', {
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalReleases: response.totalReleases,
        receivedReleases: response.releases.length
      });
      
      setReleases(prev => {
        const newReleases = currentPage === 1 ? response.releases : [...prev, ...response.releases];
        console.log('Total releases after update:', newReleases.length);
        return newReleases;
      });
      
      const hasMorePages = currentPage < response.totalPages;
      console.log('Has more pages:', hasMorePages);
      setHasMore(hasMorePages);
      
      if (currentPage === 1) {
        // Fetch top tracks only on initial load
        const popularTracks = await databaseService.getTracksByLabel(recordLabel, 'popularity');
        if (Array.isArray(popularTracks)) {
          setTopTracks(popularTracks.slice(0, 10));
        }
      }

      setError(null);
    } catch (err) {
      console.error(`Error fetching data for label ${label}:`, err);
      setError(err instanceof Error ? err.message : `Failed to load data for label ${label}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setReleases([]);
    setHasMore(true);
    fetchReleases(1);
  }, [label]);

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchReleases(nextPage);
    }
  };

  return {
    releases,
    topTracks,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore
  };
};

export default useReleases;
