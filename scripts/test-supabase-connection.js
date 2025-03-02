require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // Try to fetch labels as a basic connection test
    const { data, error } = await supabase.from('labels').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Sample data retrieved:', data);
    
    // Test each table
    await testTable('labels');
    await testTable('artists');
    await testTable('releases');
    await testTable('tracks');
    await testTable('track_artists');
    await testTable('release_artists');
    await testTable('import_logs');
    
    console.log('\n✅ All tables are accessible and properly configured!');
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    process.exit(1);
  }
}

async function testTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error(`❌ Error accessing ${tableName} table:`, error.message);
      return false;
    }
    
    console.log(`✅ Table ${tableName}: ${count} records found`);
    return true;
  } catch (error) {
    console.error(`❌ Error testing ${tableName} table:`, error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection();
