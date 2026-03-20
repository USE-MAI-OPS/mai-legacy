// ============================================================================
// Legacy Hub — Type Definitions
// Free-form canvas with manual node placement
// ============================================================================

// ---------------------------------------------------------------------------
// Connection Types — determines the SVG line style
// ---------------------------------------------------------------------------
export type ConnectionType =
  | "dna"      // Blood relatives → DNA helix wavy line
  | "friend"   // Non-blood → chain-link dashed style
  | "spouse";  // Marriage/partnership → solid thick line

// ---------------------------------------------------------------------------
// Hub Node — a person on the canvas
// ---------------------------------------------------------------------------
export interface HubNode {
  id: string;
  displayName: string;
  connectionType: ConnectionType;
  avatarUrl: string | null;
  birthYear: number | null;
  isDeceased: boolean;
  isClaimed: boolean;
  linkedMemberId: string | null;
  relationshipLabel: string | null;
  // Canvas position (persisted to DB)
  x: number;
  y: number;
  // Is this the current user?
  isMe: boolean;
}

// ---------------------------------------------------------------------------
// Hub Link — a connection between two nodes
// ---------------------------------------------------------------------------
export interface HubLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
}

// ---------------------------------------------------------------------------
// Tree data from the database
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
  position_x?: number | null;
  position_y?: number | null;
  connection_type?: string | null;
}

// ---------------------------------------------------------------------------
// Convert DB data → HubNode[] + HubLink[]
// ---------------------------------------------------------------------------
const DEFAULT_CENTER_X = 2500;
const DEFAULT_CENTER_Y = 2500;

export function convertTreeData(
  members: TreeNodeData[],
  currentUserMemberId: string | null
): { nodes: HubNode[]; links: HubLink[] } {
  const nodes: HubNode[] = [];
  const links: HubLink[] = [];
  const byId = new Map(members.map((m) => [m.id, m]));

  // Find ego node index for default positioning
  const egoIdx = members.findIndex(
    (m) => m.linked_member_id === currentUserMemberId
  );

  members.forEach((m, idx) => {
    const isMe = m.linked_member_id === currentUserMemberId;
    const connType = (m.connection_type as ConnectionType) || "dna";

    // Default position: ego at center, others spread around
    let x = m.position_x ?? null;
    let y = m.position_y ?? null;

    if (x === null || y === null) {
      if (isMe) {
        x = DEFAULT_CENTER_X;
        y = DEFAULT_CENTER_Y;
      } else {
        // Spread unpositioned nodes in a circle around center
        const angle = ((idx - (egoIdx >= 0 ? egoIdx : 0)) / members.length) * Math.PI * 2;
        const radius = 200 + Math.random() * 100;
        x = DEFAULT_CENTER_X + Math.cos(angle) * radius;
        y = DEFAULT_CENTER_Y + Math.sin(angle) * radius;
      }
    }

    nodes.push({
      id: m.id,
      displayName: m.display_name,
      connectionType: connType,
      avatarUrl: m.avatar_url,
      birthYear: m.birth_year,
      isDeceased: m.is_deceased,
      isClaimed: !!m.linked_member_id,
      linkedMemberId: m.linked_member_id,
      relationshipLabel: m.relationship_label,
      x,
      y,
      isMe,
    });

    // Parent → child links
    if (m.parent_id && byId.has(m.parent_id)) {
      links.push({
        id: `${m.parent_id}->${m.id}`,
        sourceId: m.parent_id,
        targetId: m.id,
        type: connType === "friend" ? "friend" : "dna",
      });
    }
    if (m.parent2_id && byId.has(m.parent2_id)) {
      links.push({
        id: `${m.parent2_id}->${m.id}`,
        sourceId: m.parent2_id,
        targetId: m.id,
        type: connType === "friend" ? "friend" : "dna",
      });
    }

    // Spouse link (one direction only)
    if (m.spouse_id && byId.has(m.spouse_id) && m.id < m.spouse_id) {
      links.push({
        id: `spouse:${m.id}<>${m.spouse_id}`,
        sourceId: m.id,
        targetId: m.spouse_id,
        type: "spouse",
      });
    }
  });

  return { nodes, links };
}
