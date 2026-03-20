"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitize UUID fields — "none" and empty strings become null */
function clean(val: string | null | undefined): string | null {
  if (!val || val === "none") return null;
  return val;
}

/** Auto-capitalize the first letter of each word in a name */
function capitalizeName(name: string): string {
  return name
    .split(" ")
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Tree Member Actions
// ---------------------------------------------------------------------------

export async function saveNodePosition(id: string, x: number, y: number) {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    await sb
      .from("family_tree_members")
      .update({ position_x: x, position_y: y })
      .eq("id", id);
  } catch {
    // Columns may not exist yet — silently ignore
  }
}

export async function addTreeMember(data: {
  familyId: string;
  displayName: string;
  relationshipLabel: string | null;
  parentId: string | null;
  parent2Id?: string | null;
  spouseId: string | null;
  birthYear: number | null;
  isDeceased: boolean;
  linkedMemberId?: string | null;
  connectionType?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const insertPayload: Record<string, unknown> = {
    family_id: data.familyId,
    display_name: capitalizeName(data.displayName),
    relationship_label: clean(data.relationshipLabel),
    parent_id: clean(data.parentId),
    parent2_id: clean(data.parent2Id ?? null),
    spouse_id: clean(data.spouseId),
    birth_year: data.birthYear || null,
    is_deceased: data.isDeceased,
    added_by: user.id,
  };

  // Add connection_type if provided (column may not exist yet)
  if (data.connectionType) {
    insertPayload.connection_type = data.connectionType;
  }

  // Optionally link to a signed-up family_members row (used by "Add Yourself")
  const linkedId = clean(data.linkedMemberId ?? null);
  if (linkedId) insertPayload.linked_member_id = linkedId;

  const { data: inserted, error } = await sb
    .from("family_tree_members")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Bidirectional spouse link — point the spouse back to this new member
  const spouseId = clean(data.spouseId);
  if (spouseId && inserted?.id) {
    await sb
      .from("family_tree_members")
      .update({ spouse_id: inserted.id })
      .eq("id", spouseId);
  }

  revalidatePath("/family");
  return { success: true, id: (inserted?.id as string) ?? undefined };
}

export async function updateTreeMember(
  id: string,
  data: Partial<{
    displayName: string;
    relationshipLabel: string | null;
    parentId: string | null;
    parent2Id: string | null;
    spouseId: string | null;
    birthYear: number | null;
    isDeceased: boolean;
    linkedMemberId: string | null;
    connectionType: string | null;
  }>
) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const update: Record<string, unknown> = {};
  if (data.displayName !== undefined) update.display_name = capitalizeName(data.displayName);
  if (data.relationshipLabel !== undefined)
    update.relationship_label = clean(data.relationshipLabel);
  if (data.parentId !== undefined) update.parent_id = clean(data.parentId);
  if (data.parent2Id !== undefined) update.parent2_id = clean(data.parent2Id);
  if (data.spouseId !== undefined) update.spouse_id = clean(data.spouseId);
  if (data.birthYear !== undefined) update.birth_year = data.birthYear;
  if (data.isDeceased !== undefined) update.is_deceased = data.isDeceased;
  if (data.linkedMemberId !== undefined)
    update.linked_member_id = clean(data.linkedMemberId);
  if (data.connectionType !== undefined)
    update.connection_type = data.connectionType;

  // Update the member
  const { error } = await sb
    .from("family_tree_members")
    .update(update)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // ── Bidirectional spouse sync ──
  // If spouse changed, keep both sides consistent
  if (data.spouseId !== undefined) {
    const newSpouseId = clean(data.spouseId);

    // 1) Get the old record to find the previous spouse
    const { data: current } = await sb
      .from("family_tree_members")
      .select("spouse_id")
      .eq("id", id)
      .single();

    // Note: current.spouse_id is already updated at this point, so we need
    // to clear the old spouse's reference if it was different.
    // Since the update already happened, we rely on the incoming data:

    // 2) Clear spouse_id on anyone who still points to us as their spouse
    //    (handles the "old spouse" side of a divorce)
    await sb
      .from("family_tree_members")
      .update({ spouse_id: null })
      .eq("spouse_id", id)
      .neq("id", newSpouseId ?? "00000000-0000-0000-0000-000000000000");

    // 3) If setting a new spouse, point them back to us
    if (newSpouseId) {
      await sb
        .from("family_tree_members")
        .update({ spouse_id: id })
        .eq("id", newSpouseId);
    }
  }

  revalidatePath("/family");
  return { success: true };
}

export async function deleteTreeMember(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { error } = await sb
    .from("family_tree_members")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/family");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Event Actions
// ---------------------------------------------------------------------------

export async function createEvent(data: {
  familyId: string;
  title: string;
  description: string;
  eventDate: string;
  endDate: string | null;
  location: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { error } = await sb.from("family_events").insert({
    family_id: data.familyId,
    title: data.title,
    description: data.description,
    event_date: data.eventDate,
    end_date: data.endDate || null,
    location: data.location || null,
    created_by: user.id,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/family");
  return { success: true };
}

export async function respondToEvent(
  eventId: string,
  status: "going" | "maybe" | "not_going"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { error } = await sb.from("event_rsvps").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      status,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) return { success: false, error: error.message };
  revalidatePath("/family");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { error } = await sb
    .from("family_events")
    .delete()
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/family");
  return { success: true };
}
