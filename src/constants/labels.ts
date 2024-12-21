export enum RecordLabel {
  RECORDS = 'build-it-records',
  TECH = 'build-it-tech',
  DEEP = 'build-it-deep'
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
export const RECORD_LABELS: Record<string, RecordLabel> = {
  'Build It Records': RecordLabel.RECORDS,
  'Build It Tech': RecordLabel.TECH,
  'Build It Deep': RecordLabel.DEEP
} as const;

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
