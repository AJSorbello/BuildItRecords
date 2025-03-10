const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Database utilities for the BuildItRecords application
 * Provides consistent access to Supabase clients and SQL helper functions
 */

// Cache Supabase clients to prevent multiple instantiations
let supabaseInstance = null;
let supabaseAdminInstance = null;

/**
 * Get or create a Supabase client with regular permissions
 * @returns {Object} Supabase client
 */
function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[database] Missing Supabase credentials for regular client');
      throw new Error('Missing Supabase credentials');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    console.log('[database] Created new Supabase client instance');
  }
  
  return supabaseInstance;
}

/**
 * Get or create a Supabase admin client with elevated permissions
 * @returns {Object} Supabase admin client
 */
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[database] Missing Supabase credentials for admin client');
      throw new Error('Missing Supabase admin credentials');
    }
    
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[database] Created new Supabase admin instance');
  }
  
  return supabaseAdminInstance;
}

/**
 * Check if a column exists in a table
 * @param {string} tableName - Table name to check
 * @param {string} columnName - Column name to check
 * @returns {Promise<boolean>} - Whether the column exists
 */
async function columnExists(tableName, columnName) {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc(
      'column_exists', 
      { table_name: tableName, column_name: columnName }
    ).single();
    
    if (error) {
      console.error(`[database] Error checking column existence: ${error.message}`);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error(`[database] Exception checking column existence: ${err.message}`);
    return false;
  }
}

/**
 * Check if a function exists in the database
 * @param {string} functionName - Function name to check
 * @returns {Promise<boolean>} - Whether the function exists
 */
async function functionExists(functionName) {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc(
      'function_exists', 
      { function_name: functionName }
    ).single();
    
    if (error) {
      console.error(`[database] Error checking function existence: ${error.message}`);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error(`[database] Exception checking function existence: ${err.message}`);
    return false;
  }
}

/**
 * Get database schema information
 * @returns {Promise<Object>} Schema information
 */
async function getSchemaInfo() {
  try {
    const admin = getSupabaseAdmin();
    
    // Get all tables
    const { data: tables, error: tablesError } = await admin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
      
    if (tablesError) {
      console.error(`[database] Error fetching tables: ${tablesError.message}`);
      return { error: tablesError.message };
    }
    
    // Get schema for each table
    const schemaInfo = {};
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      const { data: columns, error: columnsError } = await admin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
        
      if (columnsError) {
        console.error(`[database] Error fetching columns for ${tableName}: ${columnsError.message}`);
        schemaInfo[tableName] = { error: columnsError.message };
      } else {
        schemaInfo[tableName] = columns;
      }
    }
    
    return schemaInfo;
  } catch (err) {
    console.error(`[database] Exception fetching schema: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = {
  getSupabase,
  getSupabaseAdmin,
  columnExists,
  functionExists,
  getSchemaInfo
};
