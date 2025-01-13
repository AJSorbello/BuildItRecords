export const RECORD_LABELS = {
  BUILDIT_DEEP: { id: 'buildit-deep', name: 'Build It Deep' },
  BUILDIT_TECH: { id: 'buildit-tech', name: 'Build It Tech' },
  BUILDIT_HOUSE: { id: 'buildit-house', name: 'Build It House' }
} as const;

export type RecordLabel = typeof RECORD_LABELS[keyof typeof RECORD_LABELS];
export type RecordLabelId = RecordLabel['id'];
export type RecordLabelName = RecordLabel['name'];
