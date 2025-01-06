export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Label {
  id: string;
  displayName: string;
  spotifyIds: string[];
}

export type LabelId = 'buildit-records' | 'buildit-tech' | 'buildit-deep';

export const LABELS: Label[] = [
  {
    id: 'buildit-records',
    displayName: 'Build It Records',
    spotifyIds: []
  },
  {
    id: 'buildit-tech',
    displayName: 'Build It Tech',
    spotifyIds: []
  },
  {
    id: 'buildit-deep',
    displayName: 'Build It Deep',
    spotifyIds: []
  }
];

// Export everything from env.ts
export * from './env';
