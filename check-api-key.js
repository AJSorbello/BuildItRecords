/**
 * Script to help validate Supabase API key and access
 */
const { createClient } = require('@supabase/supabase-js') // eslint-disable-line @typescript-eslint/no-var-requires;
const readline = require('readline') // eslint-disable-line @typescript-eslint/no-var-requires;

// Create interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testSupabaseConnection() {
  console.log('=== Supabase API Key Validation Tool ===');
  console.log('This script will help verify your Supabase API keys\n');
  
  // Get project URL
  const supabaseUrl = 'https://liuaozuvkmvanmchndzl.supabase.co';
  console.log(`Using Supabase URL: ${supabaseUrl}\n`);
  
  // Prompt for API key
  console.log('Please enter your Supabase API key.');
  console.log('You can find this in your Supabase project dashboard under:');
  console.log('Project Settings > API > Project API keys\n');
  
  // Get anon key
  console.log('First, let\'s test the anon key (public).');
  const anonKey = await prompt('Enter your anon key: ');
  
  if (anonKey) {
    console.log('\nTesting with anon key...');
    const anonSuccess = await testKey(supabaseUrl, anonKey, 'anon');
    
    if (!anonSuccess) {
      console.log('\nLet\'s try the service_role key (private, more permissions).');
      const serviceKey = await prompt('Enter your service_role key: ');
      
      if (serviceKey) {
        console.log('\nTesting with service_role key...');
        await testKey(supabaseUrl, serviceKey, 'service_role');
      }
    }
  } else {
    console.log('No key provided, skipping test.');
  }
  
  console.log('\nTest completed. Make sure to update your environment variables with the working key.');
  rl.close();
}

async function testKey(url, key, keyType) {
  try {
    console.log(`Initializing Supabase client with ${keyType} key...`);
    const supabase = createClient(url, key);
    
    // Basic query to test connection 
    console.log('Testing connection by querying labels table...');
    const { data, error } = await supabase.from('labels').select('*');
    
    if (error) {
      console.error(`❌ Error with ${keyType} key:`, error);
      return false;
    } else {
      console.log(`✅ Success! Found ${data.length} labels using ${keyType} key.`);
      if (data.length > 0) {
        console.log('\nAvailable labels:');
        data.forEach(label => {
          console.log(`- ${label.name} (ID: ${label.id})`);
        });
      }
      
      // Show how to update the environment variables
      console.log('\n=== UPDATE YOUR ENVIRONMENT VARIABLES ===');
      console.log('Add the following to your start-api-with-env.sh file:');
      console.log(`export SUPABASE_URL=${url}`);
      console.log(`export SUPABASE_ANON_KEY=${key}`);
      console.log(`export VITE_SUPABASE_URL=${url}`);
      console.log(`export VITE_SUPABASE_ANON_KEY=${key}`);
      console.log(`export NEXT_PUBLIC_SUPABASE_URL=${url}`);
      console.log(`export NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`);
      
      return true;
    }
  } catch (error) {
    console.error(`❌ Unexpected error testing Supabase connection with ${keyType} key:`, error);
    return false;
  }
}

// Run the test
testSupabaseConnection().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});
