export enum RecordLabel {
  RECORDS = 'Build It Records',
  TECH = 'Build It Tech',
  DEEP = 'Build It Deep'
}

export type LabelId = 'records' | 'tech' | 'deep';
export type LabelKey = keyof typeof RecordLabel;

export const RECORD_LABELS: { [key in RecordLabel]: RecordLabel } = {
  [RecordLabel.RECORDS]: RecordLabel.RECORDS,
  [RecordLabel.TECH]: RecordLabel.TECH,
  [RecordLabel.DEEP]: RecordLabel.DEEP
} as const;

export const labelIdToKey: { [key in LabelId]: RecordLabel } = {
  'records': RecordLabel.RECORDS,
  'tech': RecordLabel.TECH,
  'deep': RecordLabel.DEEP
} as const;

export const LABEL_URLS = {
  [RecordLabel.RECORDS]: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',  // Today's Top Hits
  [RecordLabel.TECH]: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',     // Dance Rising
  [RecordLabel.DEEP]: 'https://open.spotify.com/playlist/37i9dQZF1DX8tZsk68tuDw'      // Dance Classics
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
