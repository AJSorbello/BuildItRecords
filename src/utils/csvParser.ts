import Papa from 'papaparse';
import { Release } from '../types/release';

export interface Artist {
  name: string;
  releases: Release[];
  genres: string[];
}

export const parseCSV = (csvText: string): Promise<Release[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => {
        const releases = results.data
          .filter((row: any) => row.Artist && row.Title)
          .map((row: any) => ({
            id: row.ID || Math.random().toString(36).substr(2, 9),
            title: row.Title,
            artist: row.Artist,
            artwork: row.Artwork || '',
            releaseDate: row.ReleaseDate || new Date().toISOString().split('T')[0],
            spotifyUrl: row.SpotifyURL || '',
            beatportUrl: row.BeatportURL || '',
            soundcloudUrl: row.SoundCloudURL || '',
            label: row.Label || 'records', // Default to 'records' if not specified
            tracks: [],
          }));
        resolve(releases);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
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
