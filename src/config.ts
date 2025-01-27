export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

export const RECORD_LABELS = {
  'buildit-records': { 
    id: 'buildit-records', 
    name: 'Build It Records', 
    displayName: 'Build It Records',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  'buildit-tech': { 
    id: 'buildit-tech', 
    name: 'Build It Tech', 
    displayName: 'Build It Tech',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  'buildit-deep': { 
    id: 'buildit-deep', 
    name: 'Build It Deep', 
    displayName: 'Build It Deep',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
} as const;

export const LABELS = [
  RECORD_LABELS['buildit-records'],
  RECORD_LABELS['buildit-tech'],
  RECORD_LABELS['buildit-deep']
] as const;

export type LabelId = typeof LABELS[number]['id'];

const config = {
  API_URL,
  LABELS,
  RECORD_LABELS
};

export default config;
