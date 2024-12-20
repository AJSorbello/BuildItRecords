export type RecordLabel = 'Build It Records' | 'Build It Tech' | 'Build It Deep';

export const RECORD_LABELS = {
  RECORDS: 'Build It Records' as RecordLabel,
  TECH: 'Build It Tech' as RecordLabel,
  DEEP: 'Build It Deep' as RecordLabel
} as const;

export const LABEL_URLS = {
  [RECORD_LABELS.RECORDS]: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',  // Today's Top Hits
  [RECORD_LABELS.TECH]: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',     // Dance Rising
  [RECORD_LABELS.DEEP]: 'https://open.spotify.com/playlist/37i9dQZF1DX8tZsk68tuDw'      // Dance Classics
} as const;

export const LABEL_COLORS = {
  [RECORD_LABELS.RECORDS]: '#FF4081',
  [RECORD_LABELS.TECH]: '#00BCD4',
  [RECORD_LABELS.DEEP]: '#9C27B0'
} as const;

export const LABEL_DESCRIPTIONS = {
  [RECORD_LABELS.RECORDS]: 'Main label focusing on house music',
  [RECORD_LABELS.TECH]: 'Dedicated to cutting-edge techno & tech house',
  [RECORD_LABELS.DEEP]: 'Deep house and melodic techno imprint'
} as const;
