-- Add label column to artists table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'label') THEN
        ALTER TABLE artists ADD COLUMN label VARCHAR(50);
    END IF;
END $$;

-- Update existing artists to have a default label (you may want to adjust this based on your data)
UPDATE artists SET label = 'records' WHERE label IS NULL;
