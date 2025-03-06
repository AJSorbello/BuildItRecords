#!/bin/bash
# Fixed migration script for BuildItRecords
# Maps columns correctly between local database and Supabase

set -e  # Exit immediately if a command exits with non-zero status

# Configuration
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="builditrecords"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="postgres"

# Supabase Configuration
SUPABASE_DB_HOST="db.liuaozuvkmvanmchndzl.supabase.co"
SUPABASE_DB_PORT="5432"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD="H0u53Mu51c11!"

# Temporary files
ARTISTS_EXPORT="artists_export.csv"
TRACKS_EXPORT="tracks_export.csv"
LABELS_EXPORT="labels_export.csv"

echo "🚀 Starting fixed migration to Supabase..."

echo "🔌 Testing connection to Supabase..."
if PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "SELECT 1" -o /dev/null 2>/dev/null; then
    echo "✅ Successfully connected to Supabase"
else
    echo "❌ Error: Could not connect to Supabase database. Please check your credentials."
    exit 1
fi

# Clear existing data from Supabase tables (if any)
echo "🧹 Clearing existing data from Supabase tables..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "DELETE FROM tracks; DELETE FROM artists; DELETE FROM labels;"

# Export artists from local database with proper column mapping
echo "📦 Exporting artists from local database..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -c "\COPY (SELECT spotify_id AS id, name, bio, image_url, spotify_url, null AS label_id, created_at, updated_at FROM artists) TO '${ARTISTS_EXPORT}' WITH CSV HEADER"

# Export tracks from local database with proper column mapping
echo "📦 Exporting tracks from local database..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -c "\COPY (SELECT spotify_id AS id, title, duration_ms/1000 AS duration, track_number, disc_number, null AS isrc, preview_url, null AS spotify_url, null AS release_id, null AS label_id, created_at, updated_at FROM tracks) TO '${TRACKS_EXPORT}' WITH CSV HEADER"

# Export labels from local database
echo "📦 Exporting labels from local database..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -c "\COPY (SELECT id, name, name AS display_name, lower(replace(name, ' ', '-')) AS slug, null AS playlist_id, created_at, updated_at FROM labels) TO '${LABELS_EXPORT}' WITH CSV HEADER"

# Import artists to Supabase
echo "📥 Importing artists to Supabase..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "\COPY artists(id, name, bio, image_url, spotify_url, label_id, created_at, updated_at) FROM '${ARTISTS_EXPORT}' WITH CSV HEADER"

# Import tracks to Supabase
echo "📥 Importing tracks to Supabase..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "\COPY tracks(id, title, duration, track_number, disc_number, isrc, preview_url, spotify_url, release_id, label_id, created_at, updated_at) FROM '${TRACKS_EXPORT}' WITH CSV HEADER"

# Import labels to Supabase
echo "📥 Importing labels to Supabase..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "\COPY labels(id, name, display_name, slug, playlist_id, created_at, updated_at) FROM '${LABELS_EXPORT}' WITH CSV HEADER"

# Verify data import
echo "✅ Verifying data import by counting rows in each table..."
LOCAL_ARTISTS_COUNT=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -t -c "SELECT COUNT(*) FROM artists" | tr -d ' ')
SUPABASE_ARTISTS_COUNT=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -t -c "SELECT COUNT(*) FROM artists" | tr -d ' ')

LOCAL_TRACKS_COUNT=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -t -c "SELECT COUNT(*) FROM tracks" | tr -d ' ')
SUPABASE_TRACKS_COUNT=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -t -c "SELECT COUNT(*) FROM tracks" | tr -d ' ')

LOCAL_LABELS_COUNT=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -t -c "SELECT COUNT(*) FROM labels" | tr -d ' ')
SUPABASE_LABELS_COUNT=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -t -c "SELECT COUNT(*) FROM labels" | tr -d ' ')

echo "   - Table artists: Local: ${LOCAL_ARTISTS_COUNT} rows, Supabase: ${SUPABASE_ARTISTS_COUNT} rows"
echo "   - Table tracks: Local: ${LOCAL_TRACKS_COUNT} rows, Supabase: ${SUPABASE_TRACKS_COUNT} rows"
echo "   - Table labels: Local: ${LOCAL_LABELS_COUNT} rows, Supabase: ${SUPABASE_LABELS_COUNT} rows"

echo "🧹 Cleaning up temporary files..."
rm -f "${ARTISTS_EXPORT}" "${TRACKS_EXPORT}" "${LABELS_EXPORT}"

echo "🎉 Migration completed!"
echo "   The data has been migrated to your Supabase database."
echo "   Now you can visit your deployed site at: https://build-it-records-gkqregxtn-ajsorbellos-projects.vercel.app/"
echo "   And the admin dashboard at: https://build-it-records-gkqregxtn-ajsorbellos-projects.vercel.app/admin/login"
