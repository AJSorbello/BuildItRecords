-- RLS Policies for Build It Records application
-- Created: 2025-03-23

-- ALBUMS TABLE
-- Allow anyone to read all albums
CREATE POLICY "Albums are viewable by everyone" ON public.albums
FOR SELECT USING (true);

-- Allow only authenticated users to insert/update/delete
CREATE POLICY "Only auth users can modify albums" ON public.albums
FOR ALL USING (auth.role() = 'authenticated');

-- Allow direct database connections for imports
CREATE POLICY "Import script can write to albums" ON public.albums
FOR INSERT WITH CHECK (true);
CREATE POLICY "Import script can update albums" ON public.albums
FOR UPDATE USING (true);

-- ALBUM_ARTISTS TABLE
-- Allow anyone to view album artists
CREATE POLICY "Album artists are viewable by everyone" ON public.album_artists
FOR SELECT USING (true);

-- Allow only authenticated users to modify
CREATE POLICY "Only auth users can modify album artists" ON public.album_artists
FOR ALL USING (auth.role() = 'authenticated');

-- Allow direct database connections for imports
CREATE POLICY "Import script can write to album_artists" ON public.album_artists
FOR INSERT WITH CHECK (true);

-- DEMO_SUBMISSIONS TABLE
-- Allow anyone to create submissions
CREATE POLICY "Anyone can submit demos" ON public.demo_submissions
FOR INSERT WITH CHECK (true);

-- Only admins can view all submissions
CREATE POLICY "Only admins can view all submissions" ON public.demo_submissions
FOR SELECT USING (auth.role() = 'authenticated');

-- SPOTIFY_CACHE TABLE
-- Allow all operations on spotify cache
CREATE POLICY "Full access to spotify cache" ON public.spotify_cache
FOR SELECT USING (true);
CREATE POLICY "Insert to spotify cache" ON public.spotify_cache
FOR INSERT WITH CHECK (true);
CREATE POLICY "Update spotify cache" ON public.spotify_cache
FOR UPDATE USING (true);
CREATE POLICY "Delete from spotify cache" ON public.spotify_cache
FOR DELETE USING (true);

-- CACHE TABLE
-- Allow all operations on cache
CREATE POLICY "Select from cache" ON public.cache
FOR SELECT USING (true);
CREATE POLICY "Insert to cache" ON public.cache
FOR INSERT WITH CHECK (true);
CREATE POLICY "Update cache" ON public.cache
FOR UPDATE USING (true);
CREATE POLICY "Delete from cache" ON public.cache
FOR DELETE USING (true);
