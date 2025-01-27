import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';
import { databaseService } from '../services/DatabaseService';

export const getArtistsByLabel = async (label: RecordLabel): Promise<Artist[]> => {
  try {
    const artists = await databaseService.getArtistsForLabel(label);
    return artists;
  } catch (err) {
    console.error('Error loading artists:', err);
    return [];
  }
};
