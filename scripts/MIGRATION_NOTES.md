# BuildItRecords - Supabase Migration Notes

## Database Schema Compatibility Issues

During migration testing, we discovered the following schema compatibility issues:

1. **Missing Columns**: 
   - The `profile_image_large_url` column does not exist in the Supabase `artists` table
   - The `status` column does not exist in the Supabase `releases` table

2. **Row Level Security (RLS)**: 
   - RLS policies in Supabase are preventing direct data insertion from the migration script
   - Permission errors: "new row violates row-level security policy for table X"
   - This requires either disabling RLS temporarily or migrating data through the Supabase dashboard

## Migration Recommendations

### Option 1: Database Level Migration (Recommended)

If you have direct database access to both your PostgreSQL instance and your Supabase instance:

1. Export your data using `pg_dump`:
   ```bash
   pg_dump -h your-postgres-host -U your-postgres-user -d your-postgres-db -F c -f buildit_data.dump
   ```

2. Import data directly using `pg_restore`:
   ```bash
   pg_restore -h your-supabase-host -U postgres -d postgres -f buildit_data.dump
   ```

3. Verify the schema matches after import, as Supabase may have schema differences.

### Option 2: CSV Export/Import

If you don't have direct database access:

1. Export each table as CSV from PostgreSQL:
   ```bash
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db \
     -c "COPY (SELECT id, name, bio, profile_image_url, profile_image_small_url, spotify_url, label_id FROM artists) TO STDOUT WITH CSV HEADER" > artists.csv
   
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db \
     -c "COPY (SELECT id, title, release_date, artwork_url, spotify_url, label_id, primary_artist_id FROM releases) TO STDOUT WITH CSV HEADER" > releases.csv
   
   # Similar commands for other tables...
   ```

2. Import the CSV files through the Supabase dashboard UI.

## Application Code Adjustments

The following adjustments were made to the application code to ensure compatibility:

1. **Artist Interface**: 
   - Updated to handle potentially missing image fields
   - Added fallback logic in `getArtistImage()` functions

2. **Migration Script**: 
   - Modified to continue processing even when errors occur during insertion
   - Added more detailed error reporting

3. **Schema Verification**:
   - Created utility scripts to check schema details and provide diagnostics

## Post-Migration Verification

After completing the migration, run the following verification steps:

1. Run `verify-supabase-schema.js` to ensure the schema matches expectations
2. Test the application with a minimal test dataset
3. Check if image URLs are working properly in the front-end

## Known Issues

- **RLS Policies**: Row Level Security policies need to be properly configured in Supabase to allow the application to function. This may require adjusting policies in the Supabase dashboard.
- **Missing Columns**: Some columns may need to be added manually to the Supabase schema if they are essential for the application.
