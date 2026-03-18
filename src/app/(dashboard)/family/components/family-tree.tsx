"use client";

import {
  useState,
  useRef,
  useTransition,
  useCallback,
  useEffect,
  memo,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  TreePine,
  Mail,
  UserPlus,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { FamilyTreeNode, type TreeNodeData } from "./family-tree-node";
import { AddTreeMemberDialog } from "./add-tree-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { addTreeMember, deleteTreeMember } from "../actions";
import { toast } from "sonner";
import {
  useFamilyForceLayout,
  type SimNode,
} from "./use-family-force-layout";
import { FamilyTreeConnectors } from "./family-tree-connectors";

// ---------------------------------------------------------------------------
// Draggable node — rendered at simulation coordinates
// ---------------------------------------------------------------------------
const DraggableNode = memo(function DraggableNode({
  node,
  currentUserId,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
  onDragStart,
  onDrag,
  onDragEnd,
  scale,
}: {
  node: SimNode;
  currentUserId: string;
  currentUserMemberId: string | null;
  onEdit: (n: TreeNodeData) => void;
  onDelete: (id: string) => void;
  onInvite: (memberName: string) => void;
  onDragStart: (id: string, x: number, y: number) => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  scale: number;
}) {
  if (!node.data) return null;

  const x = node.x ?? 0;
  const y = node.y ?? 0;

  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${x - 55}px, ${y - 55}px)`,
        width: 110,
      }}
      onPointerDown={(e) => {
        // Don't drag when clicking buttons/menus
        const target = e.target as HTMLElement;
        if (
          target.closest(
            "button, a, input, [role='button'], [role='menuitem'], [role='menu']"
          )
        )
          return;

        e.stopPropagation();
        const rect = (
          e.currentTarget.parentElement?.parentElement as HTMLElement
        )?.getBoundingClientRect();
        if (!rect) return;

        const nodeX = (e.clientX - rect.left) / scale;
        const nodeY = (e.clientY - rect.top) / scale;
        onDragStart(node.id, nodeX, nodeY);

        const onMove = (ev: PointerEvent) => {
          const mx = (ev.clientX - rect.left) / scale;
          const my = (ev.clientY - rect.top) / scale;
          onDrag(mx, my);
        };
        const onUp = () => {
          onDragEnd();
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    >
      <FamilyTreeNode
        node={node.data}
        currentUserId={currentUserId}
        currentUserMemberId={currentUserMemberId}
        onEdit={onEdit}
        onDelete={onDelete}
        onInvite={onInvite}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Tree viewport with pan & zoom + force-directed layout
// ---------------------------------------------------------------------------
function ForceDirectedTree({
  members,
  currentUserId,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
}: {
  members: TreeNodeData[];
  currentUserId: string;
  currentUserMemberId: string | null;
  onEdit: (n: TreeNodeData) => void;
  onDelete: (id: string) => void;
  onInvite: (memberName: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const {
    nodes,
    spousePairs,
    parentChildLinks,
    dragHandlers,
  } = useFamilyForceLayout(members, containerSize, currentUserMemberId);

  // Pan & zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, [role='button'], [role='menuitem'], [role='menu']"
        )
      )
        return;

      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((s) => Math.min(2, Math.max(0.2, s + delta)));
  }, []);

  const zoomIn = useCallback(() => setScale((s) => Math.min(2, s + 0.15)), []);
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(0.2, s - 0.15)),
    []
  );

  const fitToView = useCallback(() => {
    if (nodes.length === 0 || containerSize.width === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const treeWidth = maxX - minX + 300;
    const treeHeight = maxY - minY + 300;
    const newScale = Math.min(
      1.2,
      Math.max(
        0.2,
        Math.min(
          containerSize.width / treeWidth,
          containerSize.height / treeHeight
        )
      )
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setPan({
      x: containerSize.width / 2 - centerX * newScale,
      y: containerSize.height / 2 - centerY * newScale,
    });
    setScale(newScale);
  }, [nodes, containerSize]);

  // Auto-fit once simulation has some data
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!hasFitted.current && nodes.length > 0 && containerSize.width > 0) {
      // Wait a bit for simulation to settle
      const timer = setTimeout(() => {
        hasFitted.current = true;
        fitToView();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, containerSize.width, fitToView]);

  const canvasWidth = Math.max(containerSize.width * 3, 4000);
  const canvasHeight = Math.max(containerSize.height * 3, 4000);

  return (
    <div className="relative w-full h-full">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/80 backdrop-blur-sm"
          onClick={zoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/80 backdrop-blur-sm"
          onClick={zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/80 backdrop-blur-sm"
          onClick={fitToView}
        >
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Pannable & zoomable area */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: dragging.current
              ? "none"
              : "transform 0.15s ease-out",
          }}
        >
          <FamilyTreeConnectors
            spousePairs={spousePairs}
            parentChildLinks={parentChildLinks}
            width={canvasWidth}
            height={canvasHeight}
          />

          {nodes.map((node) => (
            <DraggableNode
              key={node.id}
              node={node}
              currentUserId={currentUserId}
              currentUserMemberId={currentUserMemberId}
              onEdit={onEdit}
              onDelete={onDelete}
              onInvite={onInvite}
              onDragStart={dragHandlers.onDragStart}
              onDrag={dragHandlers.onDrag}
              onDragEnd={dragHandlers.onDragEnd}
              scale={scale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-5 h-full">
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
        <ForceDirectedTree
          members={treeMembers}
          currentUserId={currentUserId}
          currentUserMemberId={currentUserMemberId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onInvite={handleInvite}
        />
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
