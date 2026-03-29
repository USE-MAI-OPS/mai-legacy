import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const RATE_LIMIT_HOURS = 24;

/**
 * POST /api/export
 *
 * Export all family data as JSON or ZIP (JSON + media files).
 *
 * Body:
 *   - format: "json" | "zip"
 *   - familyId: string
 *
 * Auth: authenticated user who is a family admin.
 * Rate limit: 1 export per 24h per family.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, familyId } = body as { format?: string; familyId?: string };

    if (!format || !familyId) {
      return NextResponse.json(
        { error: "Missing required fields: format, familyId" },
        { status: 400 }
      );
    }

    if (format !== "json" && format !== "zip") {
      return NextResponse.json(
        { error: "format must be 'json' or 'zip'" },
        { status: 400 }
      );
    }

    // --- Auth: verify user is authenticated and is an admin of this family ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client for all data queries (service role bypasses RLS for full export)
    // We validate membership here manually to prevent IDOR.
    const admin = createAdminClient();

    const { data: membership, error: memberError } = await admin
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only family admins can export data" },
        { status: 403 }
      );
    }

    // --- Rate limit: 1 export per 24h per family ---
    const { data: family, error: familyError } = await admin
      .from("families")
      .select("id, name, last_export_at")
      .eq("id", familyId)
      .single();

    if (familyError || !family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    if (family.last_export_at) {
      const lastExport = new Date(family.last_export_at);
      const hoursSince = (Date.now() - lastExport.getTime()) / (1000 * 60 * 60);
      if (hoursSince < RATE_LIMIT_HOURS) {
        const hoursRemaining = Math.ceil(RATE_LIMIT_HOURS - hoursSince);
        return NextResponse.json(
          {
            error: `Export rate limit: you can export once every ${RATE_LIMIT_HOURS} hours. Try again in ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}.`,
          },
          { status: 429 }
        );
      }
    }

    // --- Gather all exportable data ---
    const exportData = await gatherFamilyData(admin, familyId);

    // --- Update last_export_at ---
    await admin
      .from("families")
      .update({ last_export_at: new Date().toISOString() })
      .eq("id", familyId);

    const filename = `${family.name.replace(/[^a-z0-9]/gi, "_")}_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === "json") {
      const json = JSON.stringify(exportData, null, 2);
      return new Response(json, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    // --- ZIP: JSON + media files ---
    const zip = new JSZip();
    zip.file("data.json", JSON.stringify(exportData, null, 2));

    const mediaFolder = zip.folder("media");
    if (mediaFolder) {
      await bundleMedia(mediaFolder, exportData);
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}.zip"`,
      },
    });
  } catch (err) {
    console.error("[/api/export] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = ReturnType<typeof createAdminClient>;

async function gatherFamilyData(admin: AdminClient, familyId: string) {
  const [
    entries,
    skillTutorials,
    members,
    griotConversations,
    treeMembers,
    events,
    traditions,
    traditionMemories,
    reactions,
    comments,
  ] = await Promise.all([
    admin.from("entries").select("id, title, content, type, tags, created_at, updated_at, audio_url, audio_duration").eq("family_id", familyId).order("created_at"),
    admin.from("skill_tutorials").select("id, entry_id, steps, difficulty_level, estimated_time, created_at").eq("family_id", familyId),
    admin.from("family_members").select("id, display_name, role, joined_at").eq("family_id", familyId),
    admin.from("griot_conversations").select("id, messages, created_at, updated_at").eq("family_id", familyId).order("created_at"),
    admin.from("family_tree_members").select("id, display_name, relationship_label, parent_id, spouse_id, birth_year, is_deceased, avatar_url, created_at").eq("family_id", familyId),
    admin.from("family_events").select("id, title, description, event_date, end_date, location, created_at").eq("family_id", familyId).order("event_date"),
    admin.from("family_traditions").select("id, name, description, frequency, next_occurrence, last_celebrated, cover_image, created_at").eq("family_id", familyId),
    admin.from("tradition_memories").select("id, tradition_id, content, images, celebrated_on, created_at").eq("family_id", familyId),
    admin.from("entry_reactions").select("id, entry_id, reaction_type, created_at").eq("family_id", familyId),
    admin.from("entry_comments").select("id, entry_id, parent_comment_id, content, created_at").eq("family_id", familyId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    family_id: familyId,
    entries: entries.data ?? [],
    skill_tutorials: skillTutorials.data ?? [],
    members: members.data ?? [],
    griot_conversations: griotConversations.data ?? [],
    family_tree_members: treeMembers.data ?? [],
    family_events: events.data ?? [],
    family_traditions: traditions.data ?? [],
    tradition_memories: traditionMemories.data ?? [],
    entry_reactions: reactions.data ?? [],
    entry_comments: comments.data ?? [],
  };
}

// ---------------------------------------------------------------------------
// Media bundling for ZIP exports
// ---------------------------------------------------------------------------

type ExportData = Awaited<ReturnType<typeof gatherFamilyData>>;

async function bundleMedia(folder: JSZip, data: ExportData) {
  const tasks: Array<{ url: string; path: string }> = [];

  // Audio narrations from entries
  for (const entry of data.entries) {
    if (entry.audio_url) {
      const ext = entry.audio_url.split(".").pop()?.split("?")[0] ?? "mp3";
      tasks.push({ url: entry.audio_url, path: `audio/${entry.id}.${ext}` });
    }
  }

  // Cover images from traditions
  for (const tradition of data.family_traditions) {
    if (tradition.cover_image) {
      const ext = tradition.cover_image.split(".").pop()?.split("?")[0] ?? "jpg";
      tasks.push({ url: tradition.cover_image, path: `images/traditions/${tradition.id}.${ext}` });
    }
  }

  // Tradition memory images (arrays)
  for (const memory of data.tradition_memories) {
    if (Array.isArray(memory.images)) {
      memory.images.forEach((url: string, idx: number) => {
        const ext = url.split(".").pop()?.split("?")[0] ?? "jpg";
        tasks.push({ url, path: `images/tradition_memories/${memory.id}_${idx}.${ext}` });
      });
    }
  }

  // Tree member avatars
  for (const member of data.family_tree_members) {
    if (member.avatar_url) {
      const ext = member.avatar_url.split(".").pop()?.split("?")[0] ?? "jpg";
      tasks.push({ url: member.avatar_url, path: `images/tree/${member.id}.${ext}` });
    }
  }

  // (family_events has no cover_image column)

  // Fetch all media concurrently (best-effort: skip failures)
  await Promise.allSettled(
    tasks.map(async ({ url, path }) => {
      const res = await fetch(url);
      if (!res.ok) return;
      const buffer = await res.arrayBuffer();
      folder.file(path, buffer);
    })
  );
}
