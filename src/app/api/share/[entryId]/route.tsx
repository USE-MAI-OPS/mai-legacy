import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";
import type { EntryType, EntryStructuredData } from "@/types/database";

export const runtime = "edge";

// ---------------------------------------------------------------------------
// Gradient themes per entry type
// ---------------------------------------------------------------------------
const gradients: Record<EntryType, { from: string; to: string; accent: string }> = {
  recipe: { from: "#f59e0b", to: "#d97706", accent: "#fbbf24" },
  story: { from: "#78716c", to: "#57534e", accent: "#a8a29e" },
  skill: { from: "#10b981", to: "#059669", accent: "#34d399" },
  lesson: { from: "#8b5cf6", to: "#7c3aed", accent: "#a78bfa" },
  connection: { from: "#f43f5e", to: "#e11d48", accent: "#fb7185" },
  general: { from: "#6b7280", to: "#4b5563", accent: "#9ca3af" },
};

const typeLabels: Record<EntryType, { label: string; emoji: string }> = {
  recipe: { label: "Recipe", emoji: "\uD83C\uDF73" },
  story: { label: "Story", emoji: "\uD83D\uDCD6" },
  skill: { label: "Skill", emoji: "\uD83D\uDEE0\uFE0F" },
  lesson: { label: "Lesson", emoji: "\uD83C\uDF93" },
  connection: { label: "Connection", emoji: "\uD83E\uDD1D" },
  general: { label: "General", emoji: "\uD83D\uDCDD" },
};

// ---------------------------------------------------------------------------
// Extract a relevant detail from structured data
// ---------------------------------------------------------------------------
function getDetail(
  type: EntryType,
  structuredData: EntryStructuredData
): string | null {
  if (!structuredData) return null;

  switch (type) {
    case "recipe":
      if (structuredData.type === "recipe" && structuredData.data.cuisine) {
        return structuredData.data.cuisine;
      }
      break;
    case "story":
      if (structuredData.type === "story" && structuredData.data.location) {
        return structuredData.data.location;
      }
      break;
    case "skill":
      if (structuredData.type === "skill" && structuredData.data.difficulty) {
        const d = structuredData.data.difficulty;
        return d.charAt(0).toUpperCase() + d.slice(1);
      }
      break;
    case "lesson":
      if (structuredData.type === "lesson" && structuredData.data.taught_by) {
        return `Taught by ${structuredData.data.taught_by}`;
      }
      break;
    case "connection":
      if (
        structuredData.type === "connection" &&
        structuredData.data.relationship
      ) {
        return structuredData.data.relationship;
      }
      break;
  }
  return null;
}

// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;

  if (!UUID_REGEX.test(entryId)) {
    return new Response("Invalid entry ID", { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch the entry
    const { data: entry, error } = await supabase
      .from("entries")
      .select(
        "id, title, type, structured_data, author_id, family_id"
      )
      .eq("id", entryId)
      .single();

    if (error || !entry) {
      return new Response("Entry not found", { status: 404 });
    }

    // Fetch author name
    let authorName = "A family member";
    if (entry.author_id) {
      const { data: member } = await supabase
        .from("family_members")
        .select("display_name")
        .eq("user_id", entry.author_id)
        .eq("family_id", entry.family_id)
        .maybeSingle();
      if (member?.display_name) authorName = member.display_name;
    }

    const entryType = (entry.type as EntryType) || "general";
    const gradient = gradients[entryType] || gradients.general;
    const typeInfo = typeLabels[entryType] || typeLabels.general;
    const detail = getDetail(
      entryType,
      entry.structured_data as EntryStructuredData
    );

    // Truncate title if very long
    const title =
      entry.title.length > 80
        ? entry.title.slice(0, 77) + "..."
        : entry.title;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200",
            height: "630",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px",
            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Top section — badge */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                padding: "10px 24px",
                fontSize: "22px",
                color: "white",
                fontWeight: 600,
              }}
            >
              <span>{typeInfo.emoji}</span>
              <span>{typeInfo.label}</span>
            </div>
          </div>

          {/* Middle section — title + detail */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "56px",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.15,
                textShadow: "0 2px 8px rgba(0,0,0,0.15)",
                maxWidth: "1000px",
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                fontSize: "24px",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <span>By {authorName}</span>
              {detail && (
                <>
                  <span style={{ opacity: 0.5 }}>|</span>
                  <span>{detail}</span>
                </>
              )}
            </div>
          </div>

          {/* Bottom section — branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "-0.02em",
              }}
            >
              MAI Legacy
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              mailegacy.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error("Share card generation failed:", err);
    return new Response("Failed to generate share card", { status: 500 });
  }
}
