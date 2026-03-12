import { createClient } from "./client";

const BUCKET_NAME = "entry-images";

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success, or null on failure.
 */
export async function uploadEntryImage(
  file: File,
  familyId: string
): Promise<string | null> {
  const supabase = createClient();

  // Generate a unique path: family_id/timestamp_randomId.ext
  const ext = file.name.split(".").pop() || "jpg";
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const path = `${familyId}/${Date.now()}_${uniqueId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}

/**
 * Upload an avatar image to Supabase Storage.
 * Stores under avatars/{userId}_{timestamp}.{ext} and overwrites old avatar.
 * Returns the public URL on success, or null on failure.
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string | null> {
  const supabase = createClient();

  const ext = file.name.split(".").pop() || "jpg";
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const path = `avatars/${userId}_${uniqueId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Avatar upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteEntryImage(publicUrl: string): Promise<boolean> {
  const supabase = createClient();

  // Extract the path from the public URL
  // URL format: .../storage/v1/object/public/entry-images/family_id/filename.ext
  const bucketPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const idx = publicUrl.indexOf(bucketPrefix);
  if (idx === -1) return false;

  const path = publicUrl.substring(idx + bucketPrefix.length);
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}
