"use client";

// FamilyTree — thin wrapper around MaiTreeCanvas that handles the existing
// Add/Edit dialogs + delete confirmation. Canvas logic lives in mai-tree-canvas.tsx.

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { type TreeNodeData } from "./family-tree-node";
import { AddTreeMemberDialog } from "./add-tree-member-dialog";
import { deleteTreeMember, saveTreeView, deleteTreeView } from "../actions";
import { MaiTreeCanvas } from "./mai-tree-canvas";
import type { Person, View, TreeFilterSpec, TreeSplitSpec } from "./mai-tree-types";

interface RealMember {
  id: string;
  display_name: string;
  user_id: string;
}

interface SavedViewRow {
  id: string;
  label: string;
  icon: string;
  filters: TreeFilterSpec;
  split: TreeSplitSpec | null;
}

interface FamilyTreeProps {
  treeMembers: TreeNodeData[];
  realMembers: RealMember[];
  savedViews: SavedViewRow[];
  storyCounts: Record<string, number>;
  recipeCounts: Record<string, number>;
  familyId: string;
  familyName: string;
  currentUserId: string;
  currentUserMemberId: string | null;
  currentUserDisplayName: string | null;
  currentUserOccupation: string | null;
  currentUserLocation: string | null;
}

function currentYear(): number {
  return new Date().getFullYear();
}

// Derive a friendly "first name" from a full display name. Handles honorifics
// (Dr. Helen → "Dr. Helen", Ms. Henderson → "Ms. H.", Pastor James → "Pastor J.")
// so bubbles under honorific names don't truncate to just "Dr." / "Ms." / "Pastor".
const HONORIFICS = new Set(["dr.", "dr", "ms.", "ms", "mrs.", "mrs", "mr.", "mr", "pastor", "rev.", "rev", "sr.", "jr.", "prof.", "prof"]);

function deriveFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;
  const first = parts[0];
  const isHonorific = HONORIFICS.has(first.toLowerCase());
  if (isHonorific && parts.length >= 2) {
    // "Pastor James" → "Pastor J." (keep the honorific, abbreviate the given name)
    // "Dr. Helen Okafor" → "Dr. Helen" (keep both tokens; the given name is already short)
    const given = parts[1];
    if (parts.length >= 3) {
      // 3+ tokens — "Pastor James Taylor" → "Pastor J."
      return `${first} ${given[0]?.toUpperCase() ?? ""}.`;
    }
    return `${first} ${given}`;
  }
  return first;
}

// Transform a DB row → the design's Person shape.
function rowToPerson(
  row: TreeNodeData,
  realMembers: RealMember[],
  storyCounts: Record<string, number>,
  recipeCounts: Record<string, number>
): Person {
  const linked = row.linked_member_id
    ? realMembers.find((m) => m.id === row.linked_member_id)
    : null;
  const uid = linked?.user_id ?? null;

  const age = row.birth_year ? Math.max(0, currentYear() - row.birth_year) : null;
  const name = row.display_name;
  const first = deriveFirstName(name);

  return {
    id: row.id,
    name,
    first,
    relationship: row.relationship_label ?? null,
    group: (row.group_type ?? "other") as Person["group"],
    side: row.side ?? null,
    age,
    occupation: row.occupation ?? null,
    location: row.location ?? null,
    tags: row.tags ?? [],
    stories: uid ? storyCounts[uid] ?? 0 : 0,
    recipes: uid ? recipeCounts[uid] ?? 0 : 0,
    bio: row.bio ?? null,
    linkedMemberId: row.linked_member_id,
    avatarUrl: row.avatar_url,
    isDeceased: row.is_deceased,
  };
}

export function FamilyTree({
  treeMembers,
  realMembers,
  savedViews,
  storyCounts,
  recipeCounts,
  familyId,
  familyName,
  currentUserId,
  currentUserMemberId,
  currentUserDisplayName,
  currentUserOccupation,
  currentUserLocation,
}: FamilyTreeProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNode, setEditNode] = useState<TreeNodeData | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ─── Build Person list + ME ────────────────────────────────
  const { me, people } = useMemo(() => {
    const egoRow = currentUserMemberId
      ? treeMembers.find((m) => m.linked_member_id === currentUserMemberId)
      : null;

    let meOut: Person;
    const otherRows: TreeNodeData[] = [];

    if (egoRow) {
      meOut = {
        ...rowToPerson(egoRow, realMembers, storyCounts, recipeCounts),
        group: "me",
      };
      for (const r of treeMembers) if (r.id !== egoRow.id) otherRows.push(r);
    } else {
      // User has no tree node yet — synthesize a placeholder "YOU" so the
      // canvas still renders. It won't have stats/bio but centers the view.
      meOut = {
        id: "me-placeholder",
        name: currentUserDisplayName ?? "You",
        first: deriveFirstName(currentUserDisplayName ?? "You"),
        relationship: "You",
        group: "me",
        side: null,
        age: null,
        occupation: currentUserOccupation,
        location: currentUserLocation,
        tags: [],
        stories: storyCounts[currentUserId] ?? 0,
        recipes: recipeCounts[currentUserId] ?? 0,
        bio: null,
        linkedMemberId: currentUserMemberId,
        avatarUrl: null,
        isDeceased: false,
      };
      otherRows.push(...treeMembers);
    }

    const peopleOut = otherRows.map((r) =>
      rowToPerson(r, realMembers, storyCounts, recipeCounts)
    );
    return { me: meOut, people: peopleOut };
  }, [
    treeMembers,
    realMembers,
    storyCounts,
    recipeCounts,
    currentUserMemberId,
    currentUserDisplayName,
    currentUserOccupation,
    currentUserLocation,
    currentUserId,
  ]);

  // ─── Saved views → View[] ───────────────────────────────────
  const savedViewsTyped: View[] = useMemo(
    () =>
      savedViews.map((v) => ({
        id: v.id,
        label: v.label,
        icon: (v.icon as View["icon"]) ?? "bookmark",
        filters: v.filters ?? {},
        split: v.split ?? null,
        builtin: false,
      })),
    [savedViews]
  );

  // ─── Dialog handlers ────────────────────────────────────────
  const handleAddNew = useCallback(() => {
    setEditNode(null);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMemberToDelete(id);
  }, []);

  function confirmDeleteMember() {
    if (!memberToDelete) return;
    const id = memberToDelete;
    setMemberToDelete(null);
    startTransition(async () => {
      const result = await deleteTreeMember(id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to remove member");
      } else {
        toast.success("Member removed from tree");
      }
    });
  }

  // ─── Save / delete view ─────────────────────────────────────
  const onSaveView = useCallback(
    async (view: Omit<View, "id">) => {
      const result = await saveTreeView({
        familyId,
        label: view.label,
        icon: view.icon,
        filters: view.filters,
        split: view.split,
      });
      if (!result.success) {
        return { error: result.error };
      }
      // Optimistically reflected in canvas; also refresh so server-state aligns.
      router.refresh();
      return { id: result.id };
    },
    [familyId, router]
  );

  const onDeleteView = useCallback(
    async (id: string) => {
      const result = await deleteTreeView(id);
      if (!result.success) return { error: result.error };
      router.refresh();
      return {};
    },
    [router]
  );

  // Suppress unused-warning for handleDelete while the canvas doesn't wire
  // right-click-delete yet — the delete-confirm dialog is still used via the
  // existing profile modal button path in a later iteration.
  void handleDelete;

  return (
    <div className="h-full w-full">
      <MaiTreeCanvas
        people={people}
        me={me}
        familyId={familyId}
        familyName={familyName}
        savedViews={savedViewsTyped}
        onSaveView={onSaveView}
        onDeleteView={onDeleteView}
        onAddMember={handleAddNew}
      />

      <AddTreeMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={familyId}
        existingMembers={treeMembers}
        realMembers={realMembers.map((m) => ({ id: m.id, display_name: m.display_name }))}
        editNode={editNode}
        currentUserMemberId={currentUserMemberId}
      />

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => {
          if (!open) setMemberToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from family tree?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this person from your family tree.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
