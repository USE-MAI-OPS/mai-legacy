-- Create storage bucket for entry images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entry-images',
  'entry-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload entry images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'entry-images');

-- Allow public read access to entry images
CREATE POLICY "Public read access for entry images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'entry-images');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete entry images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'entry-images');
