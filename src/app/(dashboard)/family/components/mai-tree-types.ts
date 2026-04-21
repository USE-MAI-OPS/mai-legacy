// MAI Tree — client-side types ported from the handoff (handoff/MAITree.jsx + data.js).
// Kept separate from src/types/database.ts so the client doesn't have to
// import the massive Database type just to render a bubble.

import type { TreeGroupType, TreeSide, TreeFilterSpec, TreeSplitSpec } from "@/types/database";

// Re-export so consumers only need one import path.
export type { TreeGroupType, TreeSide, TreeFilterSpec, TreeSplitSpec };

// ---------------------------------------------------------------------------
// Person — the shape the design's canvas expects. Built server-side in
// `getTreeData` from family_tree_members + (optionally) joined entry counts.
// ---------------------------------------------------------------------------

export interface Person {
  id: string;
  name: string;                   // "Sandra Powell"
  first: string;                  // "Sandra" — shown under the bubble
  relationship: string | null;    // "Mother"
  group: TreeGroupType | "me";
  side: TreeSide | null;
  age: number | null;
  occupation: string | null;
  location: string | null;
  tags: string[];
  stories: number;
  recipes: number;
  bio: string | null;
  // Extras the canvas doesn't use but dialogs / server actions do.
  linkedMemberId: string | null;
  avatarUrl: string | null;
  isDeceased: boolean;
}

// ---------------------------------------------------------------------------
// View — what the sidebar renders. Built-ins live in code; customs in DB.
// ---------------------------------------------------------------------------

export type ViewIcon =
  | "sparkle"
  | "people"
  | "heart"
  | "briefcase"
  | "cap"
  | "tree"
  | "chip"
  | "split"
  | "bookmark"
  | "plus"
  | "warning";

export interface View {
  id: string;
  label: string;
  icon: ViewIcon;
  filters: TreeFilterSpec;
  split: TreeSplitSpec | null;
  builtin?: boolean;
  /** True if the view came from a Griot query — transient, not in DB. Cleared on next Griot turn. */
  griot?: boolean;
  hint?: string;
}

// ---------------------------------------------------------------------------
// FilterPlan — what `planFromQuery` and `/api/griot/tree-view` return.
// Drives the transient view the Griot injects into the sidebar.
// ---------------------------------------------------------------------------

export interface FilterLabelled extends TreeFilterSpec {
  __label?: string;
}

export interface FilterPlan {
  type: "filter" | "split";
  filters?: FilterLabelled[];
  split?: TreeSplitSpec & { label: string };
  summary: string;
}

// ---------------------------------------------------------------------------
// Locked visual settings — ported from MAITree.jsx LOCKED_SETTINGS.
// ---------------------------------------------------------------------------

export const LOCKED_SETTINGS = {
  bubbleSize: 74,
  density: 130,
  nameSize: 14,
  borderThick: 2,
  connOpacity: 30,
  showNames: true,
  showConnections: false,
  showLegend: true,
  animIntensity: 90,
  splitDensity: 160,
  splitDistance: 28,
  meBarrierPad: 14,
} as const;

// ---------------------------------------------------------------------------
// Color system — ported from data.js window.GROUPS.
// ---------------------------------------------------------------------------

export const GROUP_COLORS: Record<
  TreeGroupType | "me",
  { label: string; color: string; soft: string; hint: string }
> = {
  family:    { label: "Family",    color: "#C0704A", soft: "rgba(192,112,74,0.12)", hint: "Bloodline & extended family" },
  friend:    { label: "Friends",   color: "#3F7CB4", soft: "rgba(63,124,180,0.12)", hint: "Friend connections" },
  work:      { label: "Work",      color: "#3E8A63", soft: "rgba(62,138,99,0.12)",  hint: "Professional network" },
  school:    { label: "School",    color: "#8A5BB8", soft: "rgba(138,91,184,0.12)", hint: "School & classmates" },
  mentor:    { label: "Mentors",   color: "#B8893D", soft: "rgba(184,137,61,0.12)", hint: "Advisors & teachers" },
  community: { label: "Community", color: "#4A8B8B", soft: "rgba(74,139,139,0.12)", hint: "Community & neighbors" },
  other:     { label: "Other",     color: "#7a6550", soft: "rgba(122,101,80,0.12)", hint: "Everything else" },
  me:        { label: "You",       color: "#3D2B1F", soft: "rgba(61,43,31,0.10)",   hint: "" },
};

// ---------------------------------------------------------------------------
// Default built-in views (not stored in DB — rebuilt every render)
// ---------------------------------------------------------------------------

export const BUILTIN_VIEWS: View[] = [
  { id: "all",     label: "Everyone", icon: "sparkle",   filters: { groups: [] },                 split: null, builtin: true, hint: "Your full network" },
  { id: "family",  label: "Family",   icon: "people",    filters: { groups: ["family"] },         split: null, builtin: true, hint: "Bloodline & extended family" },
  { id: "friends", label: "Friends",  icon: "heart",     filters: { groups: ["friend"] },         split: null, builtin: true, hint: "Friend connections" },
  { id: "work",    label: "Work",     icon: "briefcase", filters: { groups: ["work"] },           split: null, builtin: true, hint: "Professional network" },
  { id: "school",  label: "School",   icon: "cap",       filters: { groups: ["school"] },         split: null, builtin: true, hint: "School & classmates" },
];
