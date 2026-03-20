"use client";

import {
  useState,
  useTransition,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  TreePine,
  Mail,
  UserPlus,
} from "lucide-react";
import { type TreeNodeData } from "./family-tree-node";
import { AddTreeMemberDialog } from "./add-tree-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { addTreeMember, deleteTreeMember } from "../actions";
import { toast } from "sonner";
import { LegacyHubCanvas } from "./legacy-hub";
import type { HubNode } from "./legacy-hub-types";

// ---------------------------------------------------------------------------
// Main component (state management, dialogs, header)
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

  const userInTree = currentUserMemberId
    ? treeMembers.some((m) => m.linked_member_id === currentUserMemberId)
    : false;

  // Bridge: LegacyHubCanvas.onEdit gives us a HubNode → find original TreeNodeData
  const handleHubEdit = useCallback(
    (hubNode: HubNode) => {
      const original = treeMembers.find((m) => m.id === hubNode.id);
      if (original) {
        setEditNode(original);
        setDialogOpen(true);
      }
    },
    [treeMembers]
  );

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
          currentUserMemberId={currentUserMemberId}
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
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Legacy Hub</h2>
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

      <div className="flex-1 min-h-0">
        <LegacyHubCanvas
          members={treeMembers}
          currentUserMemberId={currentUserMemberId}
          onEdit={handleHubEdit}
          onDelete={handleDelete}
          onInvite={handleInvite}
          onAddNew={handleAddNew}
        />
      </div>

      <AddTreeMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={familyId}
        existingMembers={treeMembers}
        realMembers={realMembers}
        editNode={editNode}
        currentUserMemberId={currentUserMemberId}
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
