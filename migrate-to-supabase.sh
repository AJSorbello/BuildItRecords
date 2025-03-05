#!/bin/bash
# Script to export data from local PostgreSQL database and import to Supabase
# Make sure to set up your local PostgreSQL credentials and Supabase credentials before running

set -e  # Exit immediately if a command exits with non-zero status

# Configuration
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="builditrecords"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD=""  # Set your local password here

SUPABASE_DB_HOST="db.liuaozuvkmvanmchndzl.supabase.co"
SUPABASE_DB_PORT="5432"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD="postgres"
SUPABASE_CONNECTION="postgres://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}?sslmode=require"

# Output files
DUMP_FILE="builditrecords_dump.sql"
SCHEMA_ONLY_FILE="schema_only.sql"
DATA_ONLY_FILE="data_only.sql"

echo "🚀 Starting database migration from local to Supabase..."

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump is not installed. Please install PostgreSQL command-line tools."
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL command-line tools."
    exit 1
fi

# Step 1: Dump schema only from local database
echo "🔍 Exporting schema from local database..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" --schema-only > "${SCHEMA_ONLY_FILE}"
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to export schema from local database"
    exit 1
fi
echo "✅ Schema exported successfully to ${SCHEMA_ONLY_FILE}"

# Step 2: Dump data only from local database
echo "📦 Exporting data from local database..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" --data-only > "${DATA_ONLY_FILE}"
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to export data from local database"
    exit 1
fi
echo "✅ Data exported successfully to ${DATA_ONLY_FILE}"

# Step 3: Check if we can connect to Supabase
echo "🔌 Testing connection to Supabase..."
if PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${SUPABASE_CONNECTION}" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Successfully connected to Supabase"
else
    echo "❌ Error: Could not connect to Supabase database. Please check your credentials."
    exit 1
fi

# Step 4: Get list of tables from local database
echo "📊 Getting list of tables from local database..."
TABLES=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | tr -d ' ')

# Step 5: Create schema in Supabase
echo "🏗️ Creating schema in Supabase..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${SUPABASE_CONNECTION}" < "${SCHEMA_ONLY_FILE}"
if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Schema creation might have had some errors, but continuing anyway..."
fi

# Step 6: Disable triggers and constraints before importing data
echo "🔒 Disabling triggers and constraints in Supabase..."
for TABLE in $TABLES; do
    echo "   - Disabling triggers for $TABLE"
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${SUPABASE_CONNECTION}" -c "ALTER TABLE $TABLE DISABLE TRIGGER ALL;" || true
done

# Step 7: Import data to Supabase
echo "📥 Importing data to Supabase..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${SUPABASE_CONNECTION}" < "${DATA_ONLY_FILE}"
if [ $? -ne 0 ]; then
    echo "⚠️ Warning: Data import might have had some errors, but continuing anyway..."
fi

# Step 8: Re-enable triggers and constraints
echo "🔓 Re-enabling triggers and constraints in Supabase..."
for TABLE in $TABLES; do
    echo "   - Re-enabling triggers for $TABLE"
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${SUPABASE_CONNECTION}" -c "ALTER TABLE $TABLE ENABLE TRIGGER ALL;" || true
done

# Step 9: Verify data import by counting rows in each table
echo "✅ Verifying data import by counting rows in each table..."
for TABLE in $TABLES; do
    LOCAL_COUNT=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -t -c "SELECT COUNT(*) FROM $TABLE;" | tr -d ' ')
    SUPABASE_COUNT=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${SUPABASE_CONNECTION}" -t -c "SELECT COUNT(*) FROM $TABLE;" | tr -d ' ')
    echo "   - Table $TABLE: Local: $LOCAL_COUNT rows, Supabase: $SUPABASE_COUNT rows"
done

echo "🎉 Database migration completed!"
echo "   Please verify the data in Supabase to ensure everything was imported correctly."
echo "   Next step: Redeploy your application to Vercel to use the new Supabase database."
