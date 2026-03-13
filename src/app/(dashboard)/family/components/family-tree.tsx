"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, TreePine, Mail, UserPlus } from "lucide-react";
import { FamilyTreeNode, type TreeNodeData } from "./family-tree-node";
import { AddTreeMemberDialog } from "./add-tree-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { addTreeMember, deleteTreeMember } from "../actions";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Tree building
// ---------------------------------------------------------------------------
interface BuiltTreeNode {
  data: TreeNodeData;
  children: BuiltTreeNode[];
  spouse: TreeNodeData | null;
}

function buildTree(members: TreeNodeData[]): BuiltTreeNode[] {
  const byId = new Map<string, TreeNodeData>();
  const childrenMap = new Map<string, TreeNodeData[]>();
  const spouseSet = new Set<string>(); // IDs that appear as someone's spouse

  // Index all members
  for (const m of members) {
    byId.set(m.id, m);
  }

  // Collect spouse references
  for (const m of members) {
    if (m.spouse_id && byId.has(m.spouse_id)) {
      spouseSet.add(m.spouse_id);
    }
  }

  // Group children by parent
  for (const m of members) {
    if (m.parent_id) {
      const siblings = childrenMap.get(m.parent_id) ?? [];
      siblings.push(m);
      childrenMap.set(m.parent_id, siblings);
    }
  }

  // Recursively build tree
  function buildNode(m: TreeNodeData): BuiltTreeNode {
    const spouse =
      m.spouse_id && byId.has(m.spouse_id) ? byId.get(m.spouse_id)! : null;
    const children = (childrenMap.get(m.id) ?? [])
      .sort((a, b) => {
        // Sort by birth year if available, otherwise by name
        if (a.birth_year && b.birth_year) return a.birth_year - b.birth_year;
        return a.display_name.localeCompare(b.display_name);
      })
      .map(buildNode);
    return { data: m, children, spouse };
  }

  // Find roots: no parent_id AND not listed only as someone's spouse
  const roots = members.filter((m) => {
    if (m.parent_id) return false;
    // If this member is someone's spouse and doesn't have their own children, they'll be rendered alongside their partner
    if (spouseSet.has(m.id)) {
      // But only skip if they have no children themselves
      const hasOwnChildren = childrenMap.has(m.id);
      if (!hasOwnChildren) return false;
    }
    return true;
  });

  return roots
    .sort((a, b) => {
      if (a.birth_year && b.birth_year) return a.birth_year - b.birth_year;
      return a.display_name.localeCompare(b.display_name);
    })
    .map(buildNode);
}

// ---------------------------------------------------------------------------
// Tree branch renderer
// ---------------------------------------------------------------------------
function TreeBranch({
  node,
  currentUserId,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  isRoot,
}: {
  node: BuiltTreeNode;
  currentUserId: string;
  currentUserMemberId: string | null;
  onEdit: (n: TreeNodeData) => void;
  onDelete: (id: string) => void;
  onInvite: (memberName: string) => void;
  isRoot?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Vertical connector from parent (unless root) */}
      {!isRoot && (
        <div className="w-0.5 h-6 bg-border" />
      )}

      {/* Node (optionally with spouse) */}
      <div className="flex items-start gap-4">
        <FamilyTreeNode
          node={node.data}
          currentUserId={currentUserId}
          currentUserMemberId={currentUserMemberId}
          onEdit={onEdit}
          onDelete={onDelete}
          onInvite={onInvite}
        />
        {node.spouse && (
          <>
            {/* Horizontal spouse connector */}
            <div className="flex items-center self-center">
              <div className="w-4 h-0.5 bg-primary/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
              <div className="w-4 h-0.5 bg-primary/50" />
            </div>
            <FamilyTreeNode
              node={node.spouse}
              currentUserId={currentUserId}
              currentUserMemberId={currentUserMemberId}
              onEdit={onEdit}
              onDelete={onDelete}
              onInvite={onInvite}
            />
          </>
        )}
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <>
          {/* Vertical line down to children horizontal bar */}
          <div className="w-0.5 h-6 bg-border" />

          {/* Children — each child owns its left/right halves of the horizontal bar */}
          <div className="flex items-start">
            {node.children.map((child, i) => {
              const total = node.children.length;
              const isOnly = total === 1;
              const isFirst = i === 0;
              const isLast = i === total - 1;

              return (
                <div
                  key={child.data.id}
                  className={`relative flex flex-col items-center ${
                    !isOnly ? "px-3" : ""
                  }`}
                >
                  {/* Horizontal bar segment — spans full wrapper width incl. padding */}
                  {!isOnly && (
                    <div className="absolute top-0 left-0 right-0 flex h-0.5">
                      <div
                        className={`flex-1 ${!isFirst ? "bg-border" : ""}`}
                      />
                      <div
                        className={`flex-1 ${!isLast ? "bg-border" : ""}`}
                      />
                    </div>
                  )}

                  {/* Child branch */}
                  <TreeBranch
                    node={child}
                    currentUserId={currentUserId}
                    currentUserMemberId={currentUserMemberId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onInvite={onInvite}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface RealMember {
  id: string;
  display_name: string;
}

interface FamilyTreeProps {
  treeMembers: TreeNodeData[];
  realMembers: RealMember[];
  familyId: string;
  currentUserId: string;
  currentUserMemberId: string | null;
  currentUserDisplayName: string | null;
}

export function FamilyTree({
  treeMembers,
  realMembers,
  familyId,
  currentUserId,
  currentUserMemberId,
  currentUserDisplayName,
}: FamilyTreeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNode, setEditNode] = useState<TreeNodeData | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForName, setInviteForName] = useState<string | null>(null);
  const [addingSelf, setAddingSelf] = useState(false);
  const [, startTransition] = useTransition();

  const tree = buildTree(treeMembers);

  // Check if current user already exists in the tree
  const userInTree = currentUserMemberId
    ? treeMembers.some((m) => m.linked_member_id === currentUserMemberId)
    : false;

  const handleEdit = useCallback((node: TreeNodeData) => {
    setEditNode(node);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Remove this person from the family tree?")) return;
    startTransition(async () => {
      const result = await deleteTreeMember(id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to remove member");
      } else {
        toast.success("Member removed from tree");
      }
    });
  }, []);

  const handleAddNew = useCallback(() => {
    setEditNode(null);
    setDialogOpen(true);
  }, []);

  const handleInvite = useCallback((memberName: string) => {
    setInviteForName(memberName);
    setInviteOpen(true);
  }, []);

  const handleInviteGeneral = useCallback(() => {
    setInviteForName(null);
    setInviteOpen(true);
  }, []);

  const handleAddSelf = useCallback(() => {
    if (!currentUserMemberId || !currentUserDisplayName) return;
    setAddingSelf(true);
    startTransition(async () => {
      try {
        const result = await addTreeMember({
          familyId,
          displayName: currentUserDisplayName,
          relationshipLabel: null,
          parentId: null,
          spouseId: null,
          birthYear: null,
          isDeceased: false,
          linkedMemberId: currentUserMemberId,
        });
        if (!result.success) {
          toast.error(result.error ?? "Failed to add yourself");
        } else {
          toast.success("You\u2019ve been added to the tree!");
        }
      } catch {
        toast.error("Something went wrong");
      } finally {
        setAddingSelf(false);
      }
    });
  }, [familyId, currentUserMemberId, currentUserDisplayName]);

  // Empty state
  if (treeMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <TreePine className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-1">
          Start Building Your Family Tree
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Add yourself first, then grow your tree by adding family members.
        </p>
        <div className="flex gap-3">
          {currentUserMemberId && currentUserDisplayName && (
            <Button onClick={handleAddSelf} disabled={addingSelf}>
              <UserPlus className="mr-2 h-4 w-4" />
              {addingSelf ? "Adding..." : "Add Myself"}
            </Button>
          )}
          <Button variant="outline" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        <AddTreeMemberDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          familyId={familyId}
          existingMembers={treeMembers}
          realMembers={realMembers}
          editNode={editNode}
        />

        <InviteMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          familyId={familyId}
          forMemberName={inviteForName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Family Tree</h2>
          <span className="text-sm text-muted-foreground">
            ({treeMembers.length} member{treeMembers.length !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleInviteGeneral}>
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Invite
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddNew}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Member
          </Button>
        </div>
      </div>

      {/* "Add Yourself" prompt when user isn't in the tree yet */}
      {!userInTree && currentUserMemberId && currentUserDisplayName && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <UserPlus className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground truncate">
              You&apos;re not in the tree yet.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleAddSelf}
            disabled={addingSelf}
            className="shrink-0"
          >
            {addingSelf ? "Adding..." : "Add Myself"}
          </Button>
        </div>
      )}

      {/* Scrollable tree area */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-10 justify-center min-w-max py-4 px-8">
          {tree.map((rootNode) => (
            <TreeBranch
              key={rootNode.data.id}
              node={rootNode}
              currentUserId={currentUserId}
              currentUserMemberId={currentUserMemberId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInvite={handleInvite}
              isRoot
            />
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <AddTreeMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={familyId}
        existingMembers={treeMembers}
        realMembers={realMembers}
        editNode={editNode}
      />

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        familyId={familyId}
        forMemberName={inviteForName}
      />
    </div>
  );
}
