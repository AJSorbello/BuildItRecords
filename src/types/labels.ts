export type LabelKey = 'RECORDS' | 'TECH' | 'DEEP';

export type RecordLabelId = 'buildit-records' | 'buildit-tech' | 'buildit-deep';

export const RECORD_LABELS: { [key: string]: RecordLabelId } = {
  RECORDS: 'buildit-records',
  TECH: 'buildit-tech',
  DEEP: 'buildit-deep'
} as const;

export interface RecordLabel {
  id: RecordLabelId;
  name: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordLabelWithArtists extends RecordLabel {
  artists: Array<{
    id: string;
    name: string;
    imageUrl?: string;
  }>;
}

export interface RecordLabelWithReleases extends RecordLabel {
  releases: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    releaseDate: string;
  }>;
}

export const validateRecordLabel = (label: string): RecordLabelId | undefined => {
  const validLabels = Object.values(RECORD_LABELS);
  return validLabels.includes(label as RecordLabelId) ? label as RecordLabelId : undefined;
};
