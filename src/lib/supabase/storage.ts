import { createClient } from "./client";
import {
  validateImageFile,
  MAX_AVATAR_SIZE_BYTES,
} from "@/lib/upload-validation";

const BUCKET_NAME = "entry-images";

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success, or null on failure.
 */
export async function uploadEntryImage(
  file: File,
  familyId: string
): Promise<string | null> {
  const check = validateImageFile(file);
  if (!check.valid) {
    console.error("Image validation failed:", check.error);
    return null;
  }

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
  const check = validateImageFile(file, MAX_AVATAR_SIZE_BYTES);
  if (!check.valid) {
    console.error("Avatar validation failed:", check.error);
    return null;
  }

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
 * Upload a family cover photo to Supabase Storage.
 * Stores under covers/{familyId}/cover.{ext} (upserts so there's only one).
 * Returns the public URL on success, or null on failure.
 */
export async function uploadFamilyCover(
  file: File,
  familyId: string
): Promise<string | null> {
  const check = validateImageFile(file);
  if (!check.valid) {
    console.error("Cover validation failed:", check.error);
    return null;
  }

  const supabase = createClient();

  const ext = file.name.split(".").pop() || "jpg";
  const path = `covers/${familyId}/cover.${ext}`;

  // Remove any existing cover first (different extension)
  const { data: existing } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`covers/${familyId}`);
  if (existing && existing.length > 0) {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove(existing.map((f) => `covers/${familyId}/${f.name}`));
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Cover upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}

/**
 * Get the family cover photo URL if one exists.
 * Returns the public URL or null.
 */
export async function getFamilyCoverUrl(
  familyId: string
): Promise<string | null> {
  const supabase = createClient();

  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`covers/${familyId}`);

  if (!files || files.length === 0) return null;

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`covers/${familyId}/${files[0].name}`);

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
