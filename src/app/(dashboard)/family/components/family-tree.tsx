"use client";

import {
  useState,
  useTransition,
  useCallback,
  useRef,
} from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Mail,
  UserPlus,
  X,
} from "lucide-react";
import { type TreeNodeData } from "./family-tree-node";
import { AddTreeMemberDialog } from "./add-tree-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { addTreeMember, deleteTreeMember } from "../actions";
import { toast } from "sonner";
import { LegacyHubCanvas } from "./legacy-hub";
import type { HubNode } from "./legacy-hub-types";
import { getMockProfile } from "./mai-tree-mock-data";

// New components
import { MaiTreeSidebar } from "./mai-tree-sidebar";
import { MaiTreeEmptyState } from "./mai-tree-empty-state";
import { MaiTreeQuickCard } from "./mai-tree-quick-card";
import { MaiTreeProfileModal } from "./mai-tree-profile-modal";
import { MaiTreeGroitPanel } from "./mai-tree-griot-panel";
import { MaiTreeInstructionBar } from "./mai-tree-instruction-bar";

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
  // ─── Existing state ───
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNode, setEditNode] = useState<TreeNodeData | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForName, setInviteForName] = useState<string | null>(null);
  const [addingSelf, setAddingSelf] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ─── New MAI Tree state ───
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [quickCardNode, setQuickCardNode] = useState<HubNode | null>(null);
  const [quickCardPos, setQuickCardPos] = useState<{ x: number; y: number } | null>(null);
  const [profileNode, setProfileNode] = useState<HubNode | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const userInTree = currentUserMemberId
    ? treeMembers.some((m) => m.linked_member_id === currentUserMemberId)
    : false;

  // ─── Existing handlers ───
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

  const handleAddNew = useCallback(() => {
    setEditNode(null);
    setDialogOpen(true);
  }, []);

  const handleInvite = useCallback((memberName: string) => {
    setInviteForName(memberName);
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

  // ─── New MAI Tree handlers ───
  const handleNodeClick = useCallback(
    (node: HubNode, screenPos: { x: number; y: number }) => {
      // Convert screen coords to container-relative coords
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      const relX = rect ? screenPos.x - rect.left : screenPos.x;
      const relY = rect ? screenPos.y - rect.top : screenPos.y;

      // Clamp position so card doesn't overflow
      const cardW = 224; // w-56
      const cardH = 280;
      const maxX = rect ? rect.width - cardW - 8 : relX;
      const maxY = rect ? rect.height - cardH - 8 : relY;

      setQuickCardNode(node);
      setQuickCardPos({
        x: Math.min(relX + 16, maxX),
        y: Math.min(relY - 40, Math.max(8, maxY)),
      });
    },
    []
  );

  const handleNodeDoubleClick = useCallback((node: HubNode) => {
    setQuickCardNode(null);
    setQuickCardPos(null);
    setProfileNode(node);
  }, []);

  const handleQuickCardClose = useCallback(() => {
    setQuickCardNode(null);
    setQuickCardPos(null);
  }, []);

  const handleViewProfile = useCallback(() => {
    if (quickCardNode) {
      setProfileNode(quickCardNode);
      setQuickCardNode(null);
      setQuickCardPos(null);
    }
  }, [quickCardNode]);

  const handleFilterChange = useCallback((filter: string | null) => {
    setActiveFilter(filter);
  }, []);

  // ─── Shared dialogs (rendered in both empty + populated states) ───
  const dialogs = (
    <>
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

      <MaiTreeProfileModal
        open={!!profileNode}
        onOpenChange={(open) => {
          if (!open) setProfileNode(null);
        }}
        node={profileNode}
        mockProfile={
          profileNode
            ? getMockProfile(profileNode.id, profileNode.displayName)
            : null
        }
      />
    </>
  );

  // ─── Empty state ───
  if (treeMembers.length === 0) {
    return (
      <div className="flex h-full">
        <MaiTreeSidebar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onAddNew={handleAddNew}
        />
        <div className="flex-1 relative min-w-0">
          <MaiTreeEmptyState
            currentUserDisplayName={currentUserDisplayName}
            onAddNew={handleAddNew}
          />
        </div>
        {dialogs}
      </div>
    );
  }

  // ─── Populated state ───
  return (
    <div className="flex h-full">
      <MaiTreeSidebar
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onAddNew={handleAddNew}
      />
      <div ref={canvasContainerRef} className="flex-1 relative min-w-0 overflow-hidden">
        {/* "Not in tree" banner */}
        {!userInTree && currentUserMemberId && currentUserDisplayName && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full border border-primary/20 bg-card/90 backdrop-blur-sm shadow-sm px-4 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserPlus className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                You&apos;re not in the tree yet.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleAddSelf}
              disabled={addingSelf}
              className="shrink-0 rounded-full h-7 text-xs"
            >
              {addingSelf ? "Adding..." : "Add Myself"}
            </Button>
          </div>
        )}

        {/* Filter pill */}
        {activeFilter && (
          <div className="absolute top-3 right-14 z-20">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
            >
              Filtered: {activeFilter}
              <button
                onClick={() => setActiveFilter(null)}
                className="ml-0.5 hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Canvas */}
        <LegacyHubCanvas
          members={treeMembers}
          currentUserMemberId={currentUserMemberId}
          onEdit={handleHubEdit}
          onDelete={handleDelete}
          onInvite={handleInvite}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
        />

        {/* Instruction bar */}
        <MaiTreeInstructionBar />

        {/* Quick card */}
        {quickCardNode && quickCardPos && (
          <MaiTreeQuickCard
            node={quickCardNode}
            position={quickCardPos}
            mockProfile={getMockProfile(
              quickCardNode.id,
              quickCardNode.displayName
            )}
            onClose={handleQuickCardClose}
            onViewProfile={handleViewProfile}
          />
        )}

        {/* Griot panel */}
        <MaiTreeGroitPanel />
      </div>

      {dialogs}
    </div>
  );
}
