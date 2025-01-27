import { RecordLabel } from '../types/labels';

export interface Release {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  type: 'album' | 'single' | 'ep';
  coverUrl: string;
  tracks: Array<{
    id: string;
    title: string;
    duration: number;
    previewUrl?: string;
  }>;
}

export interface LabelData {
  id: RecordLabel;
  name: string;
  description: string;
  logoUrl: string;
  releases: Release[];
}

export const labels: LabelData[] = [
  {
    id: RecordLabel.XL,
    name: 'XL Recordings',
    description: 'Independent record label founded in 1989',
    logoUrl: '/images/labels/xl.png',
    releases: [
      {
        id: 'xl001',
        title: 'In Rainbows',
        artist: 'Radiohead',
        releaseDate: '2007-10-10',
        type: 'album',
        coverUrl: '/images/releases/in-rainbows.jpg',
        tracks: [
          {
            id: 'xl001-01',
            title: '15 Step',
            duration: 237,
            previewUrl: '/audio/previews/15-step.mp3'
          },
          // Add more tracks...
        ]
      },
      // Add more releases...
    ]
  },
  {
    id: RecordLabel.RoughTrade,
    name: 'Rough Trade Records',
    description: 'Independent record label established in 1978',
    logoUrl: '/images/labels/rough-trade.png',
    releases: [
      {
        id: 'rt001',
        title: 'The Queen Is Dead',
        artist: 'The Smiths',
        releaseDate: '1986-06-16',
        type: 'album',
        coverUrl: '/images/releases/queen-is-dead.jpg',
        tracks: [
          {
            id: 'rt001-01',
            title: 'The Queen Is Dead',
            duration: 386,
            previewUrl: '/audio/previews/queen-is-dead.mp3'
          },
          // Add more tracks...
        ]
      },
      // Add more releases...
    ]
  },
  {
    id: RecordLabel.Pitchfork,
    name: 'Pitchfork Records',
    description: 'Independent record label focused on emerging artists',
    logoUrl: '/images/labels/pitchfork.png',
    releases: [
      // Add releases...
    ]
  }
];
