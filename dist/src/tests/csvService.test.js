"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const csv_1 = require("../services/csv");
const TEST_CSV_PATH = '/Users/ajsorbello/Documents/MyWebPortfolio/builditrecords/src/assets/csv/builditaj_InventoryExport_2024-11-26_18_11_03.csv';
function testCSVService() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Test CSV Import
            yield csv_1.csvService.importCSV(TEST_CSV_PATH);
            console.log('CSV Import Test: SUCCESS');
            // Test UPC Lookup
            const upcReleases = csv_1.csvService.findReleaseByUPC('198622016599');
            console.log('\nUPC Lookup Test:');
            console.log(`Found ${upcReleases.length} tracks for UPC 198622016599:`);
            upcReleases.forEach(release => {
                console.log(`- ${release.songName} by ${release.primaryArtists}`);
            });
            // Test ISRC Lookup
            const isrcRelease = csv_1.csvService.findReleaseByISRC('QZWDD2434859');
            console.log('\nISRC Lookup Test:');
            console.log(isrcRelease ?
                `Found: ${isrcRelease.songName} by ${isrcRelease.primaryArtists}` :
                'No release found');
            // Test Label Filter
            const buildItTechReleases = csv_1.csvService.getReleasesByLabel('Build It Tech');
            console.log('\nLabel Filter Test:');
            console.log(`Found ${buildItTechReleases.length} Build It Tech releases`);
            // Test Artist Filter
            const artistReleases = csv_1.csvService.getReleasesByArtist('DJOKO');
            console.log('\nArtist Filter Test:');
            console.log(`Found ${artistReleases.length} releases by DJOKO`);
            // Test Genre Filter
            const techHouseReleases = csv_1.csvService.getReleasesByGenre('Tech House');
            console.log('\nGenre Filter Test:');
            console.log(`Found ${techHouseReleases.length} Tech House releases`);
        }
        catch (error) {
            console.error('Test failed:', error);
        }
    });
}
// Run the tests
testCSVService();
