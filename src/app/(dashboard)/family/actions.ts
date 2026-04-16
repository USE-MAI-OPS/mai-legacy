"use server";

import { createClient } from "@/lib/supabase/server";
import { isUserFamilyAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { RelationshipLabel } from "@/types/database";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase;

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

  const linkedId = clean(data.linkedMemberId ?? null);

  const { data: inserted, error } = await supabase
    .from("family_tree_members")
    .insert({
      family_id: data.familyId,
      display_name: capitalizeName(data.displayName),
      relationship_label: clean(data.relationshipLabel) as import("@/types/database").RelationshipLabel | null,
      parent_id: clean(data.parentId),
      parent2_id: clean(data.parent2Id ?? null),
      spouse_id: clean(data.spouseId),
      birth_year: data.birthYear || null,
      is_deceased: data.isDeceased,
      added_by: user.id,
      ...(data.connectionType ? { connection_type: data.connectionType } : {}),
      ...(linkedId ? { linked_member_id: linkedId } : {}),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Bidirectional spouse link — point the spouse back to this new member
  const spouseId = clean(data.spouseId);
  if (spouseId && inserted?.id) {
    await supabase
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const update: {
    display_name?: string;
    relationship_label?: RelationshipLabel | null;
    parent_id?: string | null;
    parent2_id?: string | null;
    spouse_id?: string | null;
    birth_year?: number | null;
    is_deceased?: boolean;
    linked_member_id?: string | null;
    connection_type?: string | null;
  } = {};
  if (data.displayName !== undefined) update.display_name = capitalizeName(data.displayName);
  if (data.relationshipLabel !== undefined)
    update.relationship_label = clean(data.relationshipLabel) as RelationshipLabel | null;
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
  const { error } = await supabase
    .from("family_tree_members")
    .update(update)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // ── Bidirectional spouse sync ──
  // If spouse changed, keep both sides consistent
  if (data.spouseId !== undefined) {
    const newSpouseId = clean(data.spouseId);

    // 2) Clear spouse_id on anyone who still points to us as their spouse
    //    (handles the "old spouse" side of a divorce)
    await supabase
      .from("family_tree_members")
      .update({ spouse_id: null })
      .eq("spouse_id", id)
      .neq("id", newSpouseId ?? "00000000-0000-0000-0000-000000000000");

    // 3) If setting a new spouse, point them back to us
    if (newSpouseId) {
      await supabase
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify the caller is either the person who added this tree member
  // or an admin of the family it belongs to.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (supabase as any)
    .from("family_tree_members")
    .select("added_by, family_id")
    .eq("id", id)
    .maybeSingle();

  if (!member) return { success: false, error: "Tree member not found" };

  const isAdder = member.added_by === user.id;
  const isAdmin =
    !isAdder && (await isUserFamilyAdmin(supabase, user.id, member.family_id));

  if (!isAdder && !isAdmin) {
    return {
      success: false,
      error:
        "Only the person who added this tree member or a family admin can delete it",
    };
  }

  const { error } = await supabase
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

  const { error } = await supabase.from("family_events").insert({
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

  const { error } = await supabase.from("event_rsvps").upsert(
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify the caller is either the event's creator or a family admin.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event } = await (supabase as any)
    .from("family_events")
    .select("created_by, family_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return { success: false, error: "Event not found" };

  const isCreator = event.created_by === user.id;
  const isAdmin =
    !isCreator && (await isUserFamilyAdmin(supabase, user.id, event.family_id));

  if (!isCreator && !isAdmin) {
    return {
      success: false,
      error: "Only the event creator or a family admin can delete this event",
    };
  }

  const { error } = await supabase
    .from("family_events")
    .delete()
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/family");
  return { success: true };
}
