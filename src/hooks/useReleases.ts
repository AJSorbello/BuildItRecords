import { useState, useEffect } from 'react';
import { Album } from '../types/release';
import { RecordLabel, labelIdToKey } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';

export interface UseReleasesProps {
  label: keyof typeof labelIdToKey;
}

export const useReleases = ({ label }: UseReleasesProps) => {
  const [releases, setReleases] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const labelEnum = labelIdToKey[label];
        if (!labelEnum) {
          throw new Error(`Invalid label: ${label}`);
        }
        const fetchedReleases = await databaseService.getReleasesByLabel(labelEnum);
        setReleases(fetchedReleases);
      } catch (err) {
        console.error(`Error fetching releases for label ${label}:`, err);
        setError(err instanceof Error ? err.message : `Failed to load releases for label ${label}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [label]);

  return { releases, loading, error };
};

export default useReleases;
