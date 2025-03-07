/**
 * Direct test of Supabase connection
 */
const { createClient } = require('@supabase/supabase-js');

// Hardcode the Supabase URL and key from our environment file to ensure they're used
const supabaseUrl = 'https://liuaozuvkmvanmchndzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NDM0ODAsImV4cCI6MjAyNTQxOTQ4MH0.j6TwCL8zNPJ3W5CoLzPr6p4WoQJ0xH0oQQY8UDjwZ2c';

async function testSupabaseConnection() {
  console.log('=== Testing Supabase Connection ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Supabase Key: ${supabaseKey.substring(0, 10)}...`);
  
  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Testing connection with a simple query...');
    
    // Try to get labels
    console.log('\nTesting labels table:');
    const { data: labels, error: labelsError } = await supabase
      .from('labels')
      .select('*');
      
    if (labelsError) {
      console.error('Error getting labels:', labelsError);
    } else {
      console.log(`Successfully retrieved ${labels.length} labels`);
      if (labels.length > 0) {
        console.log('Available labels:');
        labels.forEach(label => {
          console.log(`- ${label.name} (ID: ${label.id})`);
        });
      }
    }
    
    // Try to get releases by label ID
    console.log('\nTesting releases by label:');
    for (const labelId of ['1', '2', '3']) {
      console.log(`\nFetching releases for label ID ${labelId}:`);
      
      const { data: releases, error: releasesError } = await supabase
        .from('releases')
        .select('*, artists(*)')
        .eq('label_id', labelId)
        .limit(5);
        
      if (releasesError) {
        console.error(`Error getting releases for label ${labelId}:`, releasesError);
      } else {
        console.log(`Successfully retrieved ${releases.length} releases for label ${labelId}`);
        if (releases.length > 0) {
          console.log('Sample releases:');
          releases.forEach((release, index) => {
            console.log(`${index + 1}. ${release.title || 'Untitled'}`);
          });
        } else {
          console.log('No releases found for this label.');
        }
      }
    }
    
    // Try to get artists by label ID
    console.log('\nTesting artists by label:');
    for (const labelId of ['1', '2', '3']) {
      console.log(`\nFetching artists for label ID ${labelId}:`);
      
      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .eq('label_id', labelId)
        .limit(5);
        
      if (artistsError) {
        console.error(`Error getting artists for label ${labelId}:`, artistsError);
      } else {
        console.log(`Successfully retrieved ${artists.length} artists for label ${labelId}`);
        if (artists.length > 0) {
          console.log('Sample artists:');
          artists.forEach((artist, index) => {
            console.log(`${index + 1}. ${artist.name || 'Unknown'}`);
          });
        } else {
          console.log('No artists found for this label.');
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
  }
}

// Run the test
testSupabaseConnection()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Fatal error:', error));
