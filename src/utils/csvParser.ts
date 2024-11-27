import Papa from 'papaparse';
import { Release } from '../types/release';

export interface Artist {
  name: string;
  releases: Release[];
  genres: string[];
}

interface ParseResult {
  data: Record<string, string>[];
  errors: string[];
}

export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const results: Record<string, string>[] = [];
    const errors: string[] = [];

    reader.onload = (event) => {
      const csvData = event?.target?.result as string;
      if (!csvData) {
        reject(new Error('Failed to read file'));
        return;
      }

      const lines = csvData.split('\n');
      if (lines.length === 0) {
        reject(new Error('Empty CSV file'));
        return;
      }

      const headers = lines[0].split(',').map(header => header.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(value => value.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        results.push(row);
      }

      resolve({ data: results, errors });
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

export const groupByArtists = (releases: Release[]): Artist[] => {
  const artistMap = new Map<string, Artist>();

  releases.forEach(release => {
    if (!artistMap.has(release.artist)) {
      artistMap.set(release.artist, {
        name: release.artist,
        releases: [],
        genres: [],
      });
    }
    const artist = artistMap.get(release.artist)!;
    artist.releases.push(release);
  });

  return Array.from(artistMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const filterByLabel = (items: Artist[], label: string): Artist[] => {
  const normalizedLabel = label.toLowerCase();
  return items.filter(artist => 
    artist.releases.some(release => {
      const beatportMatch = release.beatportUrl?.toLowerCase().includes(normalizedLabel);
      const soundcloudMatch = release.soundcloudUrl?.toLowerCase().includes(normalizedLabel);
      
      if (normalizedLabel === 'records') {
        return beatportMatch || soundcloudMatch || 
               release.beatportUrl?.toLowerCase().includes('build-it') ||
               release.soundcloudUrl?.toLowerCase().includes('build-it');
      } else if (normalizedLabel === 'tech') {
        return beatportMatch || soundcloudMatch || 
               release.beatportUrl?.toLowerCase().includes('build-it-tech') ||
               release.soundcloudUrl?.toLowerCase().includes('build-it-tech');
      } else if (normalizedLabel === 'deep') {
        return beatportMatch || soundcloudMatch || 
               release.beatportUrl?.toLowerCase().includes('build-it-deep') ||
               release.soundcloudUrl?.toLowerCase().includes('build-it-deep');
      }
      
      return beatportMatch || soundcloudMatch;
    })
  );
};
