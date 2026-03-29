/**
 * Shared file-upload validation: allowed MIME types and size limits.
 * Used by both client components and server actions to prevent
 * arbitrary file uploads and oversized files.
 */

// -- Image uploads (entry photos, avatars, cover photos) ---------------------

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

/** 10 MB — applies to individual entry / cover images */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** 5 MB — stricter limit for avatars */
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

// -- Audio uploads (entry narration) -----------------------------------------

export const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
]);

/** 50 MB — generous limit for narration recordings */
export const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;

// -- Helpers ------------------------------------------------------------------

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(
  file: File,
  maxBytes = MAX_IMAGE_SIZE_BYTES
): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type || "unknown"}" is not allowed. Accepted: JPEG, PNG, GIF, WebP, AVIF.`,
    };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large (${humanSize(file.size)}). Maximum: ${humanSize(maxBytes)}.`,
    };
  }
  return { valid: true };
}

export function validateAudioFile(file: File): ValidationResult {
  if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Audio type "${file.type || "unknown"}" is not allowed. Accepted: WebM, MP3, MP4, OGG, WAV.`,
    };
  }
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Audio file is too large (${humanSize(file.size)}). Maximum: ${humanSize(MAX_AUDIO_SIZE_BYTES)}.`,
    };
  }
  return { valid: true };
}
