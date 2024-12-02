export const RECORD_LABELS = {
  RECORDS: 'Build It Records',
  TECH: 'Build It Tech',
  DEEP: 'Build It Deep',
} as const;

export type RecordLabel = typeof RECORD_LABELS[keyof typeof RECORD_LABELS];
