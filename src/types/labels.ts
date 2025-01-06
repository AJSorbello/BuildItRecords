export interface RecordLabel {
  id: string;
  name: string;
  displayName: string;
  playlistId?: string;
  spotifyUrl?: string;
}

export const RECORD_LABELS = {
  RECORDS: 'buildit-records',
  TECH: 'buildit-tech',
  DEEP: 'buildit-deep'
} as const;

export type RecordLabelKey = keyof typeof RECORD_LABELS;
export type RecordLabelValue = typeof RECORD_LABELS[RecordLabelKey];

export type LabelKey = 'RECORDS' | 'TECH' | 'DEEP';
