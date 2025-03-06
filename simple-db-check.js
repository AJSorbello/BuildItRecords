// Simple script to check Supabase database status
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Label names
const LABEL_NAMES = {
  '1': 'BUILD IT RECORDS',
  '2': 'BUILD IT TECH',
  '3': 'BUILD IT DEEP'
};

async function checkDatabase() {
  console.log(`🔌 Connected to Supabase at: ${supabaseUrl}`);
  
  // Check tables
  await checkTable('artists');
  await checkTable('tracks');
  await checkTable('albums');
  await checkTable('labels');
  
  // Check sample data
  console.log('\n🔍 Checking sample data:');
  await getSampleData('artists');
  await getSampleData('tracks');
  await getSampleData('albums');
  
  console.log('\n✅ Database check completed');
}

async function checkTable(tableName) {
  try {
    console.log(`\n📋 Checking ${tableName} table:`);
    
    // First check if table exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${tableName} table error: ${error.message}`);
      return;
    }
    
    console.log(`✅ ${tableName} table exists`);
    
    // Count records
    const { data: countData, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      const count = countData.count || 0;
      console.log(`📊 ${tableName} table has ${count} records`);
    }
    
    // Get column info
    if (data && data.length > 0) {
      const record = data[0];
      console.log(`📝 ${tableName} table has these columns:`);
      Object.keys(record).forEach(column => {
        console.log(`   - ${column}: ${typeof record[column]}`);
      });
      
      // Check for label_id specifically
      if ('label_id' in record) {
        console.log(`✅ ${tableName} table has label_id column`);
      } else {
        console.log(`❌ ${tableName} table is missing label_id column`);
      }
    }
  } catch (err) {
    console.error(`❌ Error checking ${tableName} table:`, err.message);
  }
}

async function getSampleData(tableName) {
  try {
    console.log(`\n📊 Sample data from ${tableName} table:`);
    
    // Get sample records
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`❌ Error getting sample data from ${tableName}: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      // Show data in a clean format
      data.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        
        // Format output based on table type
        if (tableName === 'artists') {
          console.log(`  ID: ${record.id}`);
          console.log(`  Name: ${record.name}`);
          console.log(`  Label ID: ${record.label_id || 'Not set'}`);
          
          if (record.label_id) {
            console.log(`  Label: ${LABEL_NAMES[record.label_id] || 'Unknown'}`);
          }
        } else if (tableName === 'tracks') {
          console.log(`  ID: ${record.id}`);
          console.log(`  Title: ${record.title || record.name}`);
          console.log(`  Label ID: ${record.label_id || 'Not set'}`);
          
          if (record.label_id) {
            console.log(`  Label: ${LABEL_NAMES[record.label_id] || 'Unknown'}`);
          }
        } else if (tableName === 'albums') {
          console.log(`  ID: ${record.id}`);
          console.log(`  Name: ${record.name || record.title}`);
          console.log(`  Label ID: ${record.label_id || 'Not set'}`);
          
          if (record.label_id) {
            console.log(`  Label: ${LABEL_NAMES[record.label_id] || 'Unknown'}`);
          }
        } else {
          // Generic display for other tables
          Object.entries(record).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              console.log(`  ${key}: ${value}`);
            }
          });
        }
      });
    } else {
      console.log(`No records found in ${tableName} table`);
    }
  } catch (err) {
    console.error(`❌ Error getting sample data from ${tableName}:`, err.message);
  }
}

// Run the check
checkDatabase().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
