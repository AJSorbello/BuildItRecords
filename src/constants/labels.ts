export enum RecordLabel {
  RECORDS = 'buildit-records',
  TECH = 'buildit-tech',
  DEEP = 'buildit-deep'
}

export type LabelId = 'records' | 'tech' | 'deep';
export type LabelKey = keyof typeof RecordLabel;

// Display names for each label
export const LABEL_DISPLAY_NAMES = {
  [RecordLabel.RECORDS]: 'Build It Records',
  [RecordLabel.TECH]: 'Build It Tech',
  [RecordLabel.DEEP]: 'Build It Deep'
} as const;

// Map from display names to enum values
export const RECORD_LABELS = {
  [RecordLabel.RECORDS]: {
    id: RecordLabel.RECORDS,
    name: 'Build It Records',
    displayName: 'Build It Records',
    playlistId: process.env.REACT_APP_SPOTIFY_RECORDS_PLAYLIST_ID
  },
  [RecordLabel.TECH]: {
    id: RecordLabel.TECH,
    name: 'Build It Tech',
    displayName: 'Build It Tech',
    playlistId: process.env.REACT_APP_SPOTIFY_TECH_PLAYLIST_ID
  },
  [RecordLabel.DEEP]: {
    id: RecordLabel.DEEP,
    name: 'Build It Deep',
    displayName: 'Build It Deep',
    playlistId: process.env.REACT_APP_SPOTIFY_DEEP_PLAYLIST_ID
  }
};

export const labelIdToKey: { [key in LabelId]: RecordLabel } = {
  'records': RecordLabel.RECORDS,
  'tech': RecordLabel.TECH,
  'deep': RecordLabel.DEEP
} as const;

export const LABEL_URLS = {
  [RecordLabel.RECORDS]: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
  [RecordLabel.TECH]: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',
  [RecordLabel.DEEP]: 'https://open.spotify.com/playlist/37i9dQZF1DX8tZsk68tuDw'
} as const;

export const LABEL_COLORS = {
  [RecordLabel.RECORDS]: '#FF4081',
  [RecordLabel.TECH]: '#00BCD4',
  [RecordLabel.DEEP]: '#9C27B0'
} as const;

export const LABEL_DESCRIPTIONS = {
  [RecordLabel.RECORDS]: 'Build It Records - Main label focusing on house music',
  [RecordLabel.TECH]: 'Build It Tech - Dedicated to cutting-edge techno & tech house',
  [RecordLabel.DEEP]: 'Build It Deep - Deep house and melodic techno imprint'
} as const;
