import { RecordLabel } from '../types';
import { SPOTIFY_CONFIG } from '../utils/env';

// Core labels that are always available
const CORE_LABELS: { [key: string]: RecordLabel } = {
  TECH: {
    id: 'tech',
    name: 'Tech',
    displayName: 'Tech House',
    playlistId: SPOTIFY_CONFIG.TECH_PLAYLIST_ID
  },
  DEEP: {
    id: 'deep',
    name: 'Deep',
    displayName: 'Deep House',
    playlistId: SPOTIFY_CONFIG.DEEP_PLAYLIST_ID
  },
  RECORDS: {
    id: 'buildit-records',
    name: 'Records',
    displayName: 'Build It Records',
    playlistId: SPOTIFY_CONFIG.RECORDS_PLAYLIST_ID
  }
};

// Optional labels that are conditionally added
const OPTIONAL_LABELS: { [key: string]: RecordLabel } = {
  ...(SPOTIFY_CONFIG.PROGRESSIVE_PLAYLIST_ID ? {
    PROGRESSIVE: {
      id: 'progressive',
      name: 'Progressive',
      displayName: 'Progressive House',
      playlistId: SPOTIFY_CONFIG.PROGRESSIVE_PLAYLIST_ID
    }
  } : {})
};

export const RECORD_LABELS = {
  ...CORE_LABELS,
  ...OPTIONAL_LABELS
} as const;

export const getLabelById = (id: string): RecordLabel | undefined => {
  return Object.values(RECORD_LABELS).find(label => label.id === id);
};

export const getLabelByName = (name: string): RecordLabel | undefined => {
  return Object.values(RECORD_LABELS).find(
    label => label.name.toLowerCase() === name.toLowerCase()
  );
};

export const getAllLabels = (): RecordLabel[] => {
  return Object.values(RECORD_LABELS);
};

// URLs for each label's playlist
export const LABEL_URLS: { [key: string]: string } = {
  ...Object.entries(RECORD_LABELS).reduce((acc, [key, label]) => ({
    ...acc,
    [label.id]: `https://open.spotify.com/playlist/${label.playlistId}`
  }), {})
};

// Colors for each label
export const LABEL_COLORS: { [key: string]: string } = {
  tech: '#00BCD4',
  deep: '#9C27B0',
  progressive: '#FF4081',
  records: '#FF4081'
};

// Descriptions for each label
export const LABEL_DESCRIPTIONS: { [key: string]: string } = {
  tech: 'Build It Tech - Dedicated to cutting-edge techno & tech house',
  deep: 'Build It Deep - Deep house and melodic techno imprint',
  progressive: 'Build It Progressive - Progressive house and melodic techno',
  records: 'Build It Records - Main label focusing on house music'
};

// Display names for each label
export const LABEL_DISPLAY_NAMES: { [key: string]: string } = {
  tech: 'Build It Tech',
  deep: 'Build It Deep',
  progressive: 'Build It Progressive',
  records: 'Build It Records'
};
