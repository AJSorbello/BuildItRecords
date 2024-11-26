import Papa from 'papaparse';
import csvFile from '../assets/csv/builditaj_InventoryExport_2024-11-26_18_11_03.csv';

export interface Release {
  artist: string;
  title: string;
  label: string;
  catalogNumber: string;
  format: string;
  genre: string;
  style: string;
  releaseDate: string;
  quantity: number;
}

export interface Artist {
  name: string;
  releases: Release[];
  label: string;
  genres: string[];
}

export const parseCSV = async (_filePath: string): Promise<Release[]> => {
  try {
    const response = await fetch(csvFile);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const releases = results.data
            .filter((row: any) => row.Artist && row.Title) // Filter out empty rows
            .map((row: any) => ({
              artist: row.Artist,
              title: row.Title,
              label: row.Label || '',
              catalogNumber: row['Catalog Number'] || '',
              format: row.Format || '',
              genre: row.Genre || '',
              style: row.Style || '',
              releaseDate: row['Release Date'] || '',
              quantity: parseInt(row.Quantity) || 0
            }))
            .sort((a: Release, b: Release) => a.artist.localeCompare(b.artist));
          
          resolve(releases);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
};

export const groupByArtists = (releases: Release[]): Artist[] => {
  const artistMap = new Map<string, Artist>();

  releases.forEach(release => {
    if (!artistMap.has(release.artist)) {
      artistMap.set(release.artist, {
        name: release.artist,
        releases: [],
        label: release.label,
        genres: []
      });
    }

    const artist = artistMap.get(release.artist)!;
    artist.releases.push(release);
    if (release.genre && !artist.genres.includes(release.genre)) {
      artist.genres.push(release.genre);
    }
  });

  return Array.from(artistMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const filterByLabel = (items: (Release | Artist)[], label: string) => {
  return items.filter(item => {
    const itemLabel = item.label.toLowerCase();
    const searchLabel = label.toLowerCase();
    return itemLabel.includes(searchLabel) || 
           (searchLabel === 'records' && (itemLabel.includes('build it') || itemLabel.includes('buildit'))) ||
           (searchLabel === 'tech' && (itemLabel.includes('build it tech') || itemLabel.includes('buildit tech'))) ||
           (searchLabel === 'deep' && (itemLabel.includes('build it deep') || itemLabel.includes('buildit deep')));
  });
};
