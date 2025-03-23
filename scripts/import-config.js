/**
 * Import configuration for Spotify data
 * This file contains sensitive information to connect to your database
 * Do not commit this file to version control
 */

// Database configuration
exports.databaseConfig = {
  // Supabase PostgreSQL connection
  host: 'liuaozuvkmvanmchndzl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

// Spotify API keys - using the React app ones that are already working
exports.spotifyConfig = {
  clientId: '4fbf1324f46d4aa78e1533048cda96b5',
  clientSecret: 'b3b096fa2e51458993cb9e381ed25f38'
};

// Labels to import (BuildIt Records has multiple formats in Spotify)
exports.LABEL_MAPPINGS = {
  'Build It Records': ['buildit-records', '1'],
  'BuildIt Records': ['buildit-records', '1'],
  'Build It Tech': ['buildit-tech', '2'],
  'BuildIt Tech': ['buildit-tech', '2'],
  'Build It Deep': ['buildit-deep', '3'],
  'BuildIt Deep': ['buildit-deep', '3'],
};
