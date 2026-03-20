// ============================================================================
// Legacy Hub — Type Definitions
// The data model for the center-out radial network graph
// ============================================================================

// ---------------------------------------------------------------------------
// Node Types (Roles) — determines visual styling of the card
// ---------------------------------------------------------------------------
export type NodeRole =
  | "me"
  | "mom"
  | "dad"
  | "sibling"
  | "child"
  | "grandparent"
  | "uncle"
  | "aunt"
  | "cousin"
  | "friend"
  | "spouse"
  | "other";

// ---------------------------------------------------------------------------
// Link Types (Connections) — determines the SVG line style
// ---------------------------------------------------------------------------
export type LinkType =
  | "dna"      // Blood relatives → DNA helix wavy line
  | "friend"   // Non-blood → chain-link dashed style
  | "spouse";  // Marriage/partnership → solid thick line

// ---------------------------------------------------------------------------
// Hub Node — a person in the network
// ---------------------------------------------------------------------------
export interface HubNode {
  id: string;
  displayName: string;
  role: NodeRole;
  avatarUrl: string | null;
  birthYear: number | null;
  isDeceased: boolean;
  isClaimed: boolean;            // linked to an auth user
  linkedMemberId: string | null;  // family_members row id
  // D3 simulation fields (mutable, set by d3-force)
  x?: number;
  y?: number;
  fx?: number | null;  // fixed X (pinned node)
  fy?: number | null;  // fixed Y (pinned node)
  vx?: number;
  vy?: number;
  // Layout hint: distance ring from center (0 = ego, 1 = parents, 2 = grandparents, etc.)
  ring: number;
}

// ---------------------------------------------------------------------------
// Hub Link — a connection between two nodes
// ---------------------------------------------------------------------------
export interface HubLink {
  id: string;
  source: string | HubNode;  // D3 mutates these to node refs
  target: string | HubNode;
  type: LinkType;
}

// ---------------------------------------------------------------------------
// Helpers — derive link type from relationship role
// ---------------------------------------------------------------------------
const DNA_ROLES = new Set<NodeRole>([
  "mom", "dad", "sibling", "child", "grandparent", "uncle", "aunt", "cousin",
] as const);

export function linkTypeFromRole(role: NodeRole): LinkType {
  if (role === "spouse") return "spouse";
  if (role === "friend") return "friend";
  if (DNA_ROLES.has(role)) return "dna";
  return "dna"; // default to blood for "other"
}

// ---------------------------------------------------------------------------
// Helper — derive ring (distance from ego) from role
// ---------------------------------------------------------------------------
export function ringFromRole(role: NodeRole): number {
  switch (role) {
    case "me": return 0;
    case "mom":
    case "dad":
    case "spouse": return 1;
    case "sibling":
    case "child": return 1;
    case "grandparent": return 2;
    case "uncle":
    case "aunt": return 2;
    case "cousin":
    case "friend": return 3;
    default: return 3;
  }
}

// ---------------------------------------------------------------------------
// Convert existing TreeNodeData → HubNode + HubLink[]
// Bridge from the old data model to the new one
// ---------------------------------------------------------------------------
export interface TreeNodeData {
  id: string;
  display_name: string;
  relationship_label: string | null;
  parent_id: string | null;
  parent2_id?: string | null;
  spouse_id: string | null;
  linked_member_id: string | null;
  birth_year: number | null;
  is_deceased: boolean;
  avatar_url: string | null;
}

export function roleFromLabel(label: string | null): NodeRole {
  if (!label) return "other";
  const l = label.toLowerCase().trim();
  if (l === "mother" || l === "mom") return "mom";
  if (l === "father" || l === "dad") return "dad";
  if (l === "brother" || l === "sister" || l === "sibling") return "sibling";
  if (l === "son" || l === "daughter" || l === "child") return "child";
  if (l.includes("grand")) return "grandparent";
  if (l === "uncle") return "uncle";
  if (l === "aunt") return "aunt";
  if (l === "cousin") return "cousin";
  if (l === "friend") return "friend";
  if (l === "wife" || l === "husband" || l === "spouse" || l === "partner") return "spouse";
  return "other";
}

export function convertTreeData(
  members: TreeNodeData[],
  currentUserMemberId: string | null
): { nodes: HubNode[]; links: HubLink[] } {
  const nodes: HubNode[] = [];
  const links: HubLink[] = [];
  const byId = new Map(members.map((m) => [m.id, m]));

  for (const m of members) {
    const isSelf = m.linked_member_id === currentUserMemberId;
    const role: NodeRole = isSelf ? "me" : roleFromLabel(m.relationship_label);

    nodes.push({
      id: m.id,
      displayName: m.display_name,
      role,
      avatarUrl: m.avatar_url,
      birthYear: m.birth_year,
      isDeceased: m.is_deceased,
      isClaimed: !!m.linked_member_id,
      linkedMemberId: m.linked_member_id,
      ring: ringFromRole(role),
    });

    // Parent → child links (DNA)
    if (m.parent_id && byId.has(m.parent_id)) {
      links.push({
        id: `${m.parent_id}->${m.id}`,
        source: m.parent_id,
        target: m.id,
        type: "dna",
      });
    }
    if (m.parent2_id && byId.has(m.parent2_id)) {
      links.push({
        id: `${m.parent2_id}->${m.id}`,
        source: m.parent2_id,
        target: m.id,
        type: "dna",
      });
    }

    // Spouse link (only one direction to avoid duplicates)
    if (m.spouse_id && byId.has(m.spouse_id) && m.id < m.spouse_id) {
      links.push({
        id: `spouse:${m.id}<>${m.spouse_id}`,
        source: m.id,
        target: m.spouse_id,
        type: "spouse",
      });
    }
  }

  return { nodes, links };
}
