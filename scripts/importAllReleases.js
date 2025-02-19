const axios = require('axios');

const LABELS = [
  'buildit-records',
  'buildit-tech',
  'buildit-deep'
];

const API_URL = 'http://localhost:3001/api';

async function importReleasesForLabel(labelId) {
  console.log(`Starting import for label: ${labelId}`);
  try {
    const response = await axios.post(`${API_URL}/releases/${labelId}/import`);
    console.log(`Import response for ${labelId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error importing releases for ${labelId}:`, error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('Starting import for all labels...');
  
  for (const labelId of LABELS) {
    try {
      await importReleasesForLabel(labelId);
      // Wait 5 seconds between imports to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Failed to import releases for ${labelId}`);
      // Continue with next label even if one fails
      continue;
    }
  }
  
  console.log('Finished importing releases for all labels');
}

main().catch(console.error);
