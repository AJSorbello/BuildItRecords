import type { RecordLabelId, Label } from '../src/types/label';

export const RECORD_LABELS: Record<RecordLabelId, Label> = {
  BUILD_IT: {
    id: 'BUILD_IT',
    name: 'Build It Records',
    variations: ['Build It Records', 'BuildIt', 'Build-It'],
    description: 'Electronic music label focused on house and techno',
    founded_year: 2020
  },
  TECH: {
    id: 'TECH',
    name: 'Tech Records',
    variations: ['Tech Records', 'Tech', 'Tech-Records'],
    description: 'Techno music label',
    founded_year: 2021
  },
  HOUSE: {
    id: 'HOUSE',
    name: 'House Records',
    variations: ['House Records', 'House', 'House-Records'],
    description: 'House music label',
    founded_year: 2021
  }
};
