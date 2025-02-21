const XLSX = require('xlsx');
const path = require('path');

function convertCsvToXlsx() {
  const csvPath = path.join(__dirname, '../../src/assets/csv/builditaj_InventoryExport_2024-11-26_18_11_03.csv');
  const xlsxPath = path.join(__dirname, '../../src/assets/excel/track_inventory.xlsx');

  // Read CSV file
  const workbook = XLSX.readFile(csvPath, { raw: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  // Write to XLSX
  XLSX.writeFile(workbook, xlsxPath);
  console.log(`Converted CSV to XLSX: ${xlsxPath}`);
}

convertCsvToXlsx();
