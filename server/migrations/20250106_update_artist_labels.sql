-- Update artists based on their releases' labels
UPDATE artists a
SET label = l.name
FROM release_artists ra
JOIN releases r ON ra.release_id = r.id
JOIN labels l ON r.label_id = l.id
WHERE a.id = ra.artist_id;

-- For artists with multiple releases on different labels,
-- use the most recent release's label
UPDATE artists a
SET label = latest_label.name
FROM (
    SELECT DISTINCT ON (ra.artist_id) ra.artist_id, l.name
    FROM release_artists ra
    JOIN releases r ON ra.release_id = r.id
    JOIN labels l ON r.label_id = l.id
    ORDER BY ra.artist_id, r.release_date DESC
) latest_label
WHERE a.id = latest_label.artist_id;

-- Set a default label for any remaining artists without a label
UPDATE artists 
SET label = 'records' 
WHERE label IS NULL;
