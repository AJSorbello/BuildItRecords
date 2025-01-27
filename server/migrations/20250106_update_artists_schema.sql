-- Backup existing data
CREATE TABLE IF NOT EXISTS artists_backup AS SELECT * FROM artists;

-- Update artists table to match Spotify SDK format
DO $$ 
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'type') THEN
        ALTER TABLE artists ADD COLUMN type VARCHAR(255) DEFAULT 'artist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'uri') THEN
        ALTER TABLE artists ADD COLUMN uri VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'cached_at') THEN
        ALTER TABLE artists ADD COLUMN cached_at BIGINT DEFAULT extract(epoch from now())::bigint;
    END IF;

    -- Update JSON columns carefully
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'followers') THEN
        ALTER TABLE artists ALTER COLUMN followers TYPE JSONB USING 
            CASE 
                WHEN followers IS NULL THEN jsonb_build_object('total', 0, 'href', null)
                WHEN jsonb_typeof(followers) = 'number' THEN jsonb_build_object('total', followers::int, 'href', null)
                WHEN jsonb_typeof(followers) = 'object' THEN followers
                ELSE jsonb_build_object('total', 0, 'href', null)
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'external_urls') THEN
        ALTER TABLE artists ALTER COLUMN external_urls TYPE JSONB USING 
            CASE 
                WHEN external_urls IS NULL THEN jsonb_build_object('spotify', null)
                WHEN jsonb_typeof(external_urls) = 'object' THEN external_urls
                ELSE jsonb_build_object('spotify', external_urls::text)
            END;
    END IF;

    -- Ensure images column exists and has correct type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'images') THEN
        ALTER TABLE artists ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    ELSE
        ALTER TABLE artists ALTER COLUMN images TYPE JSONB USING 
            CASE 
                WHEN images IS NULL THEN '[]'::jsonb
                WHEN jsonb_typeof(images) = 'array' THEN images
                WHEN jsonb_typeof(images) = 'object' THEN jsonb_build_array(images)
                ELSE '[]'::jsonb
            END;
    END IF;

    -- Update any existing rows with null or invalid images
    UPDATE artists 
    SET images = '[]'::jsonb 
    WHERE images IS NULL OR jsonb_typeof(images) != 'array';
END $$;

-- Do the same for related_artists table
DO $$ 
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'related_artists' AND column_name = 'type') THEN
        ALTER TABLE related_artists ADD COLUMN type VARCHAR(255) DEFAULT 'artist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'related_artists' AND column_name = 'uri') THEN
        ALTER TABLE related_artists ADD COLUMN uri VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'related_artists' AND column_name = 'cached_at') THEN
        ALTER TABLE related_artists ADD COLUMN cached_at BIGINT DEFAULT extract(epoch from now())::bigint;
    END IF;

    -- Update JSON columns carefully
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'related_artists' AND column_name = 'followers') THEN
        ALTER TABLE related_artists ALTER COLUMN followers TYPE JSONB USING 
            CASE 
                WHEN followers IS NULL THEN jsonb_build_object('total', 0, 'href', null)
                WHEN jsonb_typeof(followers) = 'number' THEN jsonb_build_object('total', followers::int, 'href', null)
                WHEN jsonb_typeof(followers) = 'object' THEN followers
                ELSE jsonb_build_object('total', 0, 'href', null)
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'related_artists' AND column_name = 'external_urls') THEN
        ALTER TABLE related_artists ALTER COLUMN external_urls TYPE JSONB USING 
            CASE 
                WHEN external_urls IS NULL THEN jsonb_build_object('spotify', null)
                WHEN jsonb_typeof(external_urls) = 'object' THEN external_urls
                ELSE jsonb_build_object('spotify', external_urls::text)
            END;
    END IF;

    -- Ensure images column exists and has correct type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'related_artists' AND column_name = 'images') THEN
        ALTER TABLE related_artists ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    ELSE
        ALTER TABLE related_artists ALTER COLUMN images TYPE JSONB USING 
            CASE 
                WHEN images IS NULL THEN '[]'::jsonb
                WHEN jsonb_typeof(images) = 'array' THEN images
                WHEN jsonb_typeof(images) = 'object' THEN jsonb_build_array(images)
                ELSE '[]'::jsonb
            END;
    END IF;

    -- Update any existing rows with null or invalid images
    UPDATE related_artists 
    SET images = '[]'::jsonb 
    WHERE images IS NULL OR jsonb_typeof(images) != 'array';
END $$;
