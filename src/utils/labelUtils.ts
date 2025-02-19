import { RECORD_LABELS } from '../constants/labels';
import type { Label } from '../types/label';

export function getLabelById(id: string): Label | undefined {
  return Object.values(RECORD_LABELS).find(label => label.id === id);
}

export function getLabelByName(name: string): Label | undefined {
  const normalizedName = name.toLowerCase();
  return Object.values(RECORD_LABELS).find(label =>
    label.variations.some(variation => 
      variation.toLowerCase().includes(normalizedName)
    )
  );
}

export function getLabelVariations(name: string): string[] {
  const label = getLabelByName(name);
  return label ? [...label.variations] : [name];
}

export function getAllLabelVariations(): string[] {
  return Object.values(RECORD_LABELS).flatMap(label => [...label.variations]);
}

export function getAllLabels(): Label[] {
  return Object.values(RECORD_LABELS);
}

export function validateLabelId(id: string): boolean {
  return !!getLabelById(id);
}

export function getLabelName(id: string): string {
  const label = getLabelById(id);
  return label ? label.name : '';
}

export function getLabelColor(id: string): string {
  const label = getLabelById(id);
  return label ? label.color : '#000000';
}

export function formatLabelName(label: string | { id: string; name: string }): string {
  if (typeof label === 'string') {
    const foundLabel = getLabelByName(label);
    return foundLabel ? foundLabel.name : label;
  }
  return label.name || '';
}
