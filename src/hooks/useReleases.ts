import { useState, useEffect, useCallback } from 'react';
import { Release } from 'types';
import { DatabaseApiError } from 'utils/errors';
import { databaseService } from '../services/DatabaseService';

interface UseReleasesResult {
  releases: Release[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalReleases: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useReleases(label?: string): UseReleasesResult {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReleases, setTotalReleases] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchReleases = useCallback(async () => {
    if (!label) {
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await databaseService.getReleasesByLabelId(label, currentPage);
      setReleases(prev => currentPage === 1 ? response.releases : [...prev, ...response.releases]);
      setTotalReleases(response.totalReleases);
      setTotalPages(response.totalPages);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      if (err instanceof DatabaseApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch releases');
      }
      setReleases([]);
    } finally {
      setLoading(false);
    }
  }, [label, currentPage]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when label changes
  }, [label]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
    totalReleases,
    currentPage,
    totalPages,
    hasMore,
    loadMore
  };
}
