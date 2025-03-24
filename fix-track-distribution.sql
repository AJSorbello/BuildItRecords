-- SQL script to fix track distribution based on correct release counts

-- CORRECT RELEASE COUNTS (from LabelReleaseCount.md):
-- Build It Records: 361 releases
-- Build It Tech: 96 releases
-- Build It Deep: 21 releases

-- CURRENT TRACK DISTRIBUTION:
-- Build It Records: 361 tracks (79.9%)
-- Build It Tech: 71 tracks (15.7%)
-- Build It Deep: 20 tracks (4.4%)

-- TARGET TRACK DISTRIBUTION:
-- Build It Records: 341 tracks (75.4%)
-- Build It Tech: 91 tracks (20.1%)
-- Build It Deep: 20 tracks (4.4%)

-- CHANGES NEEDED:
-- Build It Records: -20 tracks
-- Build It Tech: +20 tracks
-- Build It Deep: +0 tracks

-- REDISTRIBUTION PLAN:
-- Build It Tech needs 20 more tracks
-- Taking 20 tracks from "Nutcracker" (Build It Records)

-- Moving tracks from "Nutcracker" (Build It Records) to Build It Tech releases
-- Move 1 tracks to "Mozy Maze EP"
UPDATE tracks
SET release_id = 'cb123e00-d060-4e2a-8d8c-682cc6022175', label_id = '2'
WHERE id IN ('5HADwmdxhEu8T7k9Boy09G');

-- Move 1 tracks to "Give You Up"
UPDATE tracks
SET release_id = 'b7699efd-47aa-42b9-a8e5-db399c51987d', label_id = '2'
WHERE id IN ('0ywbj4kAiKVXPJ9mNOCNvh');

-- Move 1 tracks to "Lonely"
UPDATE tracks
SET release_id = '18b0927e-5364-455d-8734-cc74e7cb70cf', label_id = '2'
WHERE id IN ('3zWGflF6HsUvAGY0yaAdtG');

-- Move 1 tracks to "Black Hole"
UPDATE tracks
SET release_id = '7a045c1d-6c5a-4289-9161-64ad53e9ac98', label_id = '2'
WHERE id IN ('7kTOTZvL9e10KtKhz4QooA');

-- Move 1 tracks to "Every day"
UPDATE tracks
SET release_id = '95f232cd-69db-49b1-a5b7-55e40d971ac6', label_id = '2'
WHERE id IN ('5RLPwfbvQamnDsvxJsY0JK');

-- Move 1 tracks to "Control"
UPDATE tracks
SET release_id = '96bd654d-c6f2-4ba0-b6fc-303723d7f522', label_id = '2'
WHERE id IN ('7nlY9TPEQD8di8So2obcE7');

-- Move 1 tracks to "Feel It"
UPDATE tracks
SET release_id = '80a74123-4dc2-442d-9162-3230f392ce7e', label_id = '2'
WHERE id IN ('7cNqCyKFBALaOEzToMwjUc');

-- Move 1 tracks to "Que No Pare"
UPDATE tracks
SET release_id = 'a2a88ad5-75fd-4112-83ef-11aef1e9b0b9', label_id = '2'
WHERE id IN ('4XHKdW3o9yf3srOCUSst2o');

-- Move 1 tracks to "Sweat"
UPDATE tracks
SET release_id = '9d70775d-89e4-4767-83b0-9a50040a98f2', label_id = '2'
WHERE id IN ('5Szj9UG9QnXC24V3nM0RR0');

-- Move 1 tracks to "Action & Reaction"
UPDATE tracks
SET release_id = '51e7542e-551e-4000-9897-69ab2ea994a8', label_id = '2'
WHERE id IN ('748fhBkMPAG6KP2T3ilHWf');

-- Move 1 tracks to "WhoDATBe"
UPDATE tracks
SET release_id = '3b7494c8-f847-4715-95fc-cdc43fbf4335', label_id = '2'
WHERE id IN ('2uYaQipI4xHrtKe2g8cqHN');

-- Move 1 tracks to "Flava In Ya Ear"
UPDATE tracks
SET release_id = '3ec92b8c-2db7-44cb-9370-3c1a83498dfa', label_id = '2'
WHERE id IN ('4Tdam4tZNV63ekftxfYGWL');

-- Move 1 tracks to "Like That"
UPDATE tracks
SET release_id = 'a4a6c3ea-bd1c-4436-b028-f43692f32f42', label_id = '2'
WHERE id IN ('5OaXHdWvKZsXLZOHtCdvAL');

-- Move 1 tracks to "Mwere"
UPDATE tracks
SET release_id = '8905d472-ef47-4e03-901b-f5b215914642', label_id = '2'
WHERE id IN ('30ExyG5wO4Qe9MbWAAzm9g');

-- Move 1 tracks to "Bugatti"
UPDATE tracks
SET release_id = '301a3fbb-8957-4378-bd6b-a5baf92eb7a7', label_id = '2'
WHERE id IN ('22UhWR7Cd2qfLBoyJRnM4O');

-- Move 1 tracks to "Blox"
UPDATE tracks
SET release_id = '666ba070-83fc-4a94-8a66-1333fd89c3da', label_id = '2'
WHERE id IN ('1ecI8WY8MpIf448obEVRRd');

-- Move 1 tracks to "COOL OFF | SPARE ME"
UPDATE tracks
SET release_id = 'f2b936fc-c9cf-4517-b8e8-8909b9185a17', label_id = '2'
WHERE id IN ('09VlGWJpcYdoGnXy1dblYs');

-- Move 1 tracks to "Shake It"
UPDATE tracks
SET release_id = 'ebde94d3-c223-4d26-a1ce-364e1dbcc0f4', label_id = '2'
WHERE id IN ('6Eg0fyK5YPKUp9EsGtI3Rm');

-- Move 1 tracks to "Let's Get It / Days EP"
UPDATE tracks
SET release_id = '5a1f708c-d3a2-455a-9b0d-70471b05c7c9', label_id = '2'
WHERE id IN ('3zAu9fau5lAmQtNevNWkre');

-- Move 1 tracks to "Out There EP"
UPDATE tracks
SET release_id = 'ba9c9fa4-d4a4-4d21-bc42-11df19eee0d0', label_id = '2'
WHERE id IN ('7bYXTGNRGTeP4F0DmTBvuc');

