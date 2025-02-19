import type { RecordLabel } from '../types/labels';

// Core labels that are always available
export const RECORD_LABELS: { [key: string]: RecordLabel } = {
  'buildit-records': {
    id: 'buildit-records',
    name: 'Build It Records',
    displayName: 'Build It Records',
    slug: 'buildit-records',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  'buildit-tech': {
    id: 'buildit-tech',
    name: 'Build It Tech',
    displayName: 'Build It Tech',
    slug: 'buildit-tech',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  'buildit-deep': {
    id: 'buildit-deep',
    name: 'Build It Deep',
    displayName: 'Build It Deep',
    slug: 'buildit-deep',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
};

// Label display names
export const LABEL_DISPLAY_NAMES: { [key: string]: string } = {
  'buildit-records': 'Build It Records',
  'buildit-tech': 'Build It Tech',
  'buildit-deep': 'Build It Deep'
};

// Label descriptions
export const LABEL_DESCRIPTIONS: { [key: string]: string } = {
  'buildit-records': 'The main label for Build It Records, featuring a diverse range of electronic music.',
  'buildit-tech': 'Our techno-focused sublabel, delivering cutting-edge underground sounds.',
  'buildit-deep': 'Deep and melodic electronic music from emerging and established artists.'
};

// Label colors
export const LABEL_COLORS: { [key: string]: string } = {
  'buildit-records': '#FF4081',
  'buildit-tech': '#00BCD4',
  'buildit-deep': '#7C4DFF'
};

// Helper functions
export const getAllLabels = (): RecordLabel[] => Object.values(RECORD_LABELS);

export const getLabelByName = (name: string): RecordLabel | undefined =>
  Object.values(RECORD_LABELS).find(label => label.name.toLowerCase() === name.toLowerCase());

export const labelIdToKey = (id: string): string | undefined =>
  Object.keys(RECORD_LABELS).find(key => RECORD_LABELS[key].id === id);

// Re-export the RecordLabel type
export type { RecordLabel } from '../types/labels';
