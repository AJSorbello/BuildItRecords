import { csvService } from '../services/csv';

const TEST_CSV_PATH = '/Users/ajsorbello/Documents/MyWebPortfolio/builditrecords/src/assets/csv/builditaj_InventoryExport_2024-11-26_18_11_03.csv';

async function testCSVService() {
  try {
    // Test CSV Import
    await csvService.importCSV(TEST_CSV_PATH);
    console.log('CSV Import Test: SUCCESS');

    // Test UPC Lookup
    const upcReleases = csvService.findReleaseByUPC('198622016599');
    console.log('\nUPC Lookup Test:');
    console.log(`Found ${upcReleases.length} tracks for UPC 198622016599:`);
    upcReleases.forEach(release => {
      console.log(`- ${release.songName} by ${release.primaryArtists}`);
    });

    // Test ISRC Lookup
    const isrcRelease = csvService.findReleaseByISRC('QZWDD2434859');
    console.log('\nISRC Lookup Test:');
    console.log(isrcRelease ? 
      `Found: ${isrcRelease.songName} by ${isrcRelease.primaryArtists}` : 
      'No release found'
    );

    // Test Label Filter
    const buildItTechReleases = csvService.getReleasesByLabel('Build It Tech');
    console.log('\nLabel Filter Test:');
    console.log(`Found ${buildItTechReleases.length} Build It Tech releases`);

    // Test Artist Filter
    const artistReleases = csvService.getReleasesByArtist('DJOKO');
    console.log('\nArtist Filter Test:');
    console.log(`Found ${artistReleases.length} releases by DJOKO`);

    // Test Genre Filter
    const techHouseReleases = csvService.getReleasesByGenre('Tech House');
    console.log('\nGenre Filter Test:');
    console.log(`Found ${techHouseReleases.length} Tech House releases`);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testCSVService();
