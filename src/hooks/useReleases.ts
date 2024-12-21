import { useState, useEffect } from 'react';
import { Release } from '../types/release';
import { RecordLabel, labelIdToKey } from '../constants/labels';
import { apiService } from '../services/ApiService';

export interface UseReleasesProps {
  label: 'records' | 'tech' | 'deep';
}

export const useReleases = ({ label }: UseReleasesProps) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const labelEnum = labelIdToKey[label];
        const fetchedReleases = await apiService.getReleasesByLabel(labelEnum);
        setReleases(fetchedReleases);
      } catch (err) {
        console.error('Error fetching releases:', err);
        setError(err instanceof Error ? err.message : 'Failed to load releases');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [label]);

  return { releases, loading, error };
};

export default useReleases;
