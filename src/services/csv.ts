import Papa from 'papaparse';

export interface SymphonicRelease {
  labelName: string;
  catalogNumber: string;
  upc: string;
  releaseName: string;
  releaseVersion: string;
  releaseArtist: string;
  releaseDate: string;
  releaseGenre: string;
  releaseSubgenre: string;
  track: number;
  isrc: string;
  songName: string;
  mixVersion: string;
  primaryArtists: string;
  featuringArtists: string;
  remixers: string;
  trackLength: string;
  songGenre: string;
  songSubgenre: string;
}

class CSVService {
  private static instance: CSVService;
  private releases: SymphonicRelease[] = [];

  private constructor() {}

  public static getInstance(): CSVService {
    if (!CSVService.instance) {
      CSVService.instance = new CSVService();
    }
    return CSVService.instance;
  }

  // Using browser's File API instead of expo-file-system
  private async readFile(filePath: string): Promise<string> {
    const response = await fetch(filePath);
    return response.text();
  }

  public async importCSV(fileUri: string): Promise<void> {
    try {
      const csvContent = await this.readFile(fileUri);
      const result = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Transform CSV headers to camelCase property names
          return header
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, chr => chr.toLowerCase());
        }
      });

      this.releases = result.data.map((row: any) => ({
        labelName: row.labelName || '',
        catalogNumber: row.catalogNumber || '',
        upc: row.upc || '',
        releaseName: row.releaseName || '',
        releaseVersion: row.releaseVersion || '',
        releaseArtist: row.releaseArtist || '',
        releaseDate: row.releaseDate || '',
        releaseGenre: row.releaseGenre || '',
        releaseSubgenre: row.releaseSubgenre || '',
        track: parseInt(row.track) || 0,
        isrc: row.isrc || '',
        songName: row.songName || '',
        mixVersion: row.mixVersion || '',
        primaryArtists: row.primaryArtists || '',
        featuringArtists: row.featuringArtists || '',
        remixers: row.remixers || '',
        trackLength: row.trackLength || '',
        songGenre: row.songGenre || '',
        songSubgenre: row.songSubgenre || ''
      }));

      console.log(`Imported ${this.releases.length} releases from CSV`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw error;
    }
  }

  public findReleaseByUPC(upc: string): SymphonicRelease[] {
    return this.releases.filter(release => release.upc === upc);
  }

  public findReleaseByISRC(isrc: string): SymphonicRelease | undefined {
    return this.releases.find(release => release.isrc === isrc);
  }

  public getAllReleases(): SymphonicRelease[] {
    return [...this.releases];
  }

  public getReleasesByLabel(labelName: string): SymphonicRelease[] {
    return this.releases.filter(release => release.labelName === labelName);
  }

  public getReleasesByArtist(artistName: string): SymphonicRelease[] {
    return this.releases.filter(release => 
      release.releaseArtist === artistName || 
      release.primaryArtists.includes(artistName) ||
      release.featuringArtists.includes(artistName) ||
      release.remixers.includes(artistName)
    );
  }

  public getReleasesByGenre(genre: string): SymphonicRelease[] {
    const normalizedGenre = genre.toLowerCase().trim().replace(/"/g, '');
    return this.releases.filter(release => 
      release.releaseGenre.toLowerCase().trim().replace(/"/g, '') === normalizedGenre || 
      release.songGenre.toLowerCase().trim().replace(/"/g, '') === normalizedGenre ||
      release.releaseSubgenre.toLowerCase().trim().replace(/"/g, '') === normalizedGenre ||
      release.songSubgenre.toLowerCase().trim().replace(/"/g, '') === normalizedGenre
    );
  }
}

export const csvService = CSVService.getInstance();
