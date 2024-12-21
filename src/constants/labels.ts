export type RecordLabel = 'Build It Records' | 'Build It Tech' | 'Build It Deep';
export type LabelId = 'records' | 'tech' | 'deep';
export type LabelKey = RecordLabel;

export const RECORD_LABELS: { [key in RecordLabel]: RecordLabel } = {
  'Build It Records': 'Build It Records',
  'Build It Tech': 'Build It Tech',
  'Build It Deep': 'Build It Deep'
} as const;

export const labelIdToKey: { [key in LabelId]: RecordLabel } = {
  'records': 'Build It Records',
  'tech': 'Build It Tech',
  'deep': 'Build It Deep'
} as const;

export const LABEL_URLS = {
  [RECORD_LABELS['Build It Records']]: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',  // Today's Top Hits
  [RECORD_LABELS['Build It Tech']]: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675',     // Dance Rising
  [RECORD_LABELS['Build It Deep']]: 'https://open.spotify.com/playlist/37i9dQZF1DX8tZsk68tuDw'      // Dance Classics
} as const;

export const LABEL_COLORS = {
  [RECORD_LABELS['Build It Records']]: '#FF4081',
  [RECORD_LABELS['Build It Tech']]: '#00BCD4',
  [RECORD_LABELS['Build It Deep']]: '#9C27B0'
} as const;

export const LABEL_DESCRIPTIONS = {
  [RECORD_LABELS['Build It Records']]: 'Build It Records - Main label focusing on house music',
  [RECORD_LABELS['Build It Tech']]: 'Build It Tech - Dedicated to cutting-edge techno & tech house',
  [RECORD_LABELS['Build It Deep']]: 'Build It Deep - Deep house and melodic techno imprint'
} as const;
