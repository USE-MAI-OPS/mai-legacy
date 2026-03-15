import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditEntryForm from "@/components/edit-entry-form";
import EditEntryFormRouter from "@/components/edit-entry-form-router";
import type { EntryType } from "@/types/database";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getEntryForEdit(id: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: entryError } = await (supabase as any)
      .from("entries")
      .select("id, title, content, type, tags, structured_data, family_id")
      .eq("id", id)
      .single();

    if (entryError || !entry) {
      return null;
    }

    return {
      id: entry.id as string,
      title: entry.title as string,
      content: entry.content as string,
      type: entry.type as EntryType,
      tags: (entry.tags as string[] | null) ?? [],
      structured_data: (entry.structured_data as { type: string; data: Record<string, unknown> } | null) ?? null,
      familyId: (entry.family_id as string | null) ?? null,
    };
  } catch (err) {
    console.error("Failed to fetch entry for editing:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------
export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntryForEdit(id);

  if (!entry) {
    notFound();
  }

  // If the entry has structured_data, use the type-specific form for editing
  // Otherwise fall back to the generic edit form
  if (entry.structured_data && entry.structured_data.data) {
    return (
      <EditEntryFormRouter entry={entry} />
    );
  }

  return <EditEntryForm entry={entry} />;
}
