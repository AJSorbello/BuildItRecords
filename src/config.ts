export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const RECORD_LABELS = {
  'buildit-records': { 
    id: 'buildit-records', 
    name: 'Build It Records', 
    displayName: 'Build It Records',
  },
  'buildit-tech': { 
    id: 'buildit-tech', 
    name: 'Build It Tech', 
    displayName: 'Build It Tech',
  },
  'buildit-deep': { 
    id: 'buildit-deep', 
    name: 'Build It Deep', 
    displayName: 'Build It Deep',
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
