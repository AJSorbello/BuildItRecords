// Test script to fetch releases for each label
import fetch from 'node-fetch';

async function testLabels() {
  const API_URL = 'http://localhost:3001/api';
  const labels = [
    { id: 'buildit-records', name: 'Build It Records' },
    { id: 'buildit-tech', name: 'Build It Tech' },
    { id: 'buildit-deep', name: 'Build It Deep' }
  ];
  
  console.log('Testing API endpoints for each label...\n');
  
  for (const label of labels) {
    console.log(`Testing label: ${label.name} (${label.id})`);
    
    try {
      // Test the releases endpoint
      const releasesUrl = `${API_URL}/releases?label=${label.id}`;
      console.log(`Fetching: ${releasesUrl}`);
      
      const releasesResponse = await fetch(releasesUrl);
      
      if (!releasesResponse.ok) {
        console.error(`❌ Error fetching releases for ${label.name}: ${releasesResponse.status} ${releasesResponse.statusText}`);
        continue;
      }
      
      const releasesData = await releasesResponse.json();
      console.log(`✅ Successfully fetched ${releasesData.count} releases for ${label.name}`);
      
      if (releasesData.releases && releasesData.releases.length > 0) {
        console.log('  First 3 releases:');
        releasesData.releases.slice(0, 3).forEach(release => {
          console.log(`  - ${release.title} by ${release.artistName} (${release.releaseDate})`);
        });
      } else {
        console.log('  No releases found for this label');
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${label.name}: ${error.message}`);
    }
    
    console.log(''); // Empty line for spacing
  }
}

// Run the test
testLabels().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
