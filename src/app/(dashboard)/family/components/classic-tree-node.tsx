// ============================================================================
// Classic Tree Node — positioned wrapper around FamilyTreeNode
// Places the existing node component at layout-computed (x, y) coordinates
// ============================================================================

"use client";

import { FamilyTreeNode, type TreeNodeData } from "./family-tree-node";

const NODE_W = 140;

interface ClassicTreeNodeProps {
  node: TreeNodeData;
  x: number;
  y: number;
  currentUserId: string;
  currentUserMemberId: string | null;
  onEdit: (node: TreeNodeData) => void;
  onDelete: (id: string) => void;
  onInvite: (memberName: string) => void;
}

export function ClassicTreeNode({
  node,
  x,
  y,
  currentUserId,
  currentUserMemberId,
  onEdit,
  onDelete,
  onInvite,
}: ClassicTreeNodeProps) {
  return (
    <div
      className="absolute"
      style={{
        left: x - NODE_W / 2,
        top: y,
        width: NODE_W,
      }}
    >
      <FamilyTreeNode
        node={node}
        currentUserId={currentUserId}
        currentUserMemberId={currentUserMemberId}
        onEdit={onEdit}
        onDelete={onDelete}
        onInvite={onInvite}
      />
    </div>
  );
}
