"use server";

import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/get-family-context";
import { revalidatePath } from "next/cache";
import { validateAudioFile } from "@/lib/upload-validation";

// ---------------------------------------------------------------------------
// Upload audio for an entry
// ---------------------------------------------------------------------------
export async function uploadEntryAudio(
  entryId: string,
  formData: FormData
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  const ctx = await getFamilyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const { userId, familyId, supabase } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase;

  const audioFile = formData.get("audio") as File | null;
  const durationStr = formData.get("duration") as string | null;
  const duration = durationStr ? parseInt(durationStr, 10) : null;

  if (!audioFile) return { success: false, error: "No audio file provided" };

  const check = validateAudioFile(audioFile);
  if (!check.valid) return { success: false, error: check.error };

  // Verify entry ownership
  const { data: entry } = await sb
    .from("entries")
    .select("author_id, family_id")
    .eq("id", entryId)
    .maybeSingle();

  if (!entry) return { success: false, error: "Entry not found" };
  if (entry.author_id !== userId)
    return { success: false, error: "Not authorized" };

  // Upload to Supabase Storage
  const ext = audioFile.type.includes("webm") ? "webm" : "mp3";
  const path = `${familyId}/${entryId}/narration.${ext}`;

  const { error: uploadError } = await sb.storage
    .from("entry-audio")
    .upload(path, audioFile, {
      contentType: audioFile.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Audio upload error:", uploadError);
    return { success: false, error: "Failed to upload audio" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = sb.storage.from("entry-audio").getPublicUrl(path);

  // Update entry with audio URL
  const { error: updateError } = await sb
    .from("entries")
    .update({
      audio_url: publicUrl,
      audio_duration: duration,
    })
    .eq("id", entryId);

  if (updateError) {
    console.error("Entry update error:", updateError);
    return { success: false, error: "Failed to save audio" };
  }

  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/feed");
  return { success: true, audioUrl: publicUrl };
}

// ---------------------------------------------------------------------------
// Remove audio from an entry
// ---------------------------------------------------------------------------
export async function removeEntryAudio(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getFamilyContext();
  if (!ctx) return { success: false, error: "Not authenticated" };

  const { userId, familyId, supabase } = ctx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase;

  // Verify ownership
  const { data: entry } = await sb
    .from("entries")
    .select("author_id, audio_url")
    .eq("id", entryId)
    .maybeSingle();

  if (!entry || entry.author_id !== userId)
    return { success: false, error: "Not authorized" };

  // Delete from storage
  if (entry.audio_url) {
    try {
      const path = `${familyId}/${entryId}/narration.webm`;
      await sb.storage.from("entry-audio").remove([path]);
      // Also try mp3 variant
      const pathMp3 = `${familyId}/${entryId}/narration.mp3`;
      await sb.storage.from("entry-audio").remove([pathMp3]);
    } catch {
      // Storage cleanup is best-effort
    }
  }

  // Clear audio fields
  const { error } = await sb
    .from("entries")
    .update({ audio_url: null, audio_duration: null })
    .eq("id", entryId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/feed");
  return { success: true };
}
