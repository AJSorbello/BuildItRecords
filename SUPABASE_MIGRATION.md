# Migrating to Supabase: Deployment Guide

This guide walks through the steps needed to migrate BuildItRecords from PostgreSQL to Supabase and deploy to Vercel.

## 1. Create a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project:
   - Name: BuildItRecords
   - Database Password: (create a strong password)
   - Region: (choose one closest to your target users)

## 2. Set Up Database Schema

1. In the Supabase dashboard, go to the SQL Editor
2. Copy and run the SQL script from `supabase-schema.sql` in this repository
3. Verify all tables were created by checking the Table Editor

## 3. Schema Compatibility Issues

During migration testing, we discovered the following schema compatibility issues:

1. **Artist Table Fields**: 
   - The database schema may differ from what's defined in `supabase-schema.sql`
   - The `profile_image_large_url` and potentially other fields might be missing
   - Ensure your TypeScript interfaces match the actual database schema

2. **Row Level Security (RLS)**:
   - Current RLS policies in Supabase prevent direct data insertion via migration scripts
   - Data migration must be executed via the Supabase dashboard or using authenticated admin credentials

## 4. Export Data from PostgreSQL and Import to Supabase

### Option 1: Direct Database Migration (Admin Access Required)

```bash
# Export data from PostgreSQL (adjust connection details as needed)
pg_dump -h your-postgres-host -U your-postgres-user -d your-postgres-db -F c -f buildit_data.dump

# Import data into Supabase (get connection details from Supabase dashboard)
pg_restore -h your-supabase-host -U postgres -d postgres -f buildit_data.dump
```

### Option 2: CSV Export/Import (For SQL Editor)

If you encounter RLS policy issues, follow these steps:

1. Export each table as CSV:
   ```bash
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db -c "COPY labels TO STDOUT WITH CSV HEADER" > labels.csv
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db -c "COPY artists TO STDOUT WITH CSV HEADER" > artists.csv
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db -c "COPY releases TO STDOUT WITH CSV HEADER" > releases.csv
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db -c "COPY tracks TO STDOUT WITH CSV HEADER" > tracks.csv
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db -c "COPY track_artists TO STDOUT WITH CSV HEADER" > track_artists.csv
   psql -h your-postgres-host -U your-postgres-user -d your-postgres-db -c "COPY release_artists TO STDOUT WITH CSV HEADER" > release_artists.csv
   ```

2. Import each CSV in the Supabase dashboard:
   - Navigate to Table Editor
   - Select a table
   - Click "Import Data" and upload the corresponding CSV file

## 5. Configure Environment Variables

Update your local `.env` file with Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase dashboard under Settings > API.

## 6. Deploy to Vercel

1. Push your updated codebase to GitHub
2. Create a new project in Vercel, connecting to your GitHub repository
3. Configure the following environment variables in Vercel:

| Name | Value | Description |
|------|-------|-------------|
| VITE_SUPABASE_URL | https://your-project-ref.supabase.co | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6... | Your Supabase anon key |
| REACT_APP_SPOTIFY_CLIENT_ID | your-client-id | Spotify API credentials |
| REACT_APP_SPOTIFY_CLIENT_SECRET | your-client-secret | Spotify API credentials |
| ADMIN_USERNAME | admin | Admin login username |
| ADMIN_PASSWORD_HASH | your-hashed-password | Hashed admin password |
| JWT_SECRET | your-jwt-secret | Secret for JWT tokens |

4. Deploy your project
5. Set up your custom domain (`builditrecords.com`) in the Vercel project settings

## 7. Verify Functionality

After deployment, verify that all features work correctly:

- Artist listings
- Release galleries
- Track playback
- Admin functionality

## 8. Troubleshooting

If you encounter any issues during migration:

1. Check Supabase logs for database errors
2. Verify environment variables are set correctly
3. Check Vercel deployment logs for build errors
4. Ensure Supabase Row Level Security (RLS) policies are configured correctly

## 9. Clean Up

After successful migration and verification:

1. Back up any remaining PostgreSQL data
2. Decommission the old PostgreSQL database
3. Update documentation to reflect the new architecture
