"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTreeMember, updateTreeMember } from "../actions";
import { toast } from "sonner";
import { Plus, X, Users, Heart, Baby, UserPlus } from "lucide-react";
import type { TreeNodeData } from "./family-tree-node";

// ─── Constants ───────────────────────────────────────────────────────────────
const RELATIONSHIP_OPTIONS = [
  "Mother", "Father", "Son", "Daughter", "Brother", "Sister",
  "Grandmother", "Grandfather", "Grandson", "Granddaughter",
  "Great-Grandmother", "Great-Grandfather",
  "Aunt", "Uncle", "Cousin", "Niece", "Nephew",
  "Spouse", "Partner", "Step-Mother", "Step-Father",
  "Step-Son", "Step-Daughter", "Half-Brother", "Half-Sister",
  "Friend", "Godparent", "Godchild", "Other",
] as const;

const PARENT_RELATIONSHIP_OPTIONS = [
  "Mother", "Father", "Grandmother", "Grandfather",
  "Great-Grandmother", "Great-Grandfather",
  "Step-Mother", "Step-Father", "Godparent",
] as const;

const CHILD_RELATIONSHIP_OPTIONS = [
  "Son", "Daughter", "Brother", "Sister",
  "Grandson", "Granddaughter",
  "Uncle", "Aunt", "Cousin",
  "Step-Son", "Step-Daughter", "Godchild",
  "Niece", "Nephew",
  "Half-Brother", "Half-Sister",
] as const;

const SPOUSE_RELATIONSHIP_OPTIONS = [
  "Spouse", "Partner",
  "Aunt", "Uncle",
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
interface RealMember {
  id: string;
  display_name: string;
}

interface QuickAddPerson {
  name: string;
  relationship: string;
}

interface AddTreeMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  existingMembers: TreeNodeData[];
  realMembers: RealMember[];
  editNode?: TreeNodeData | null;
  currentUserMemberId?: string | null;
}

function uuidOrNull(val: string): string | null {
  if (!val || val === "none") return null;
  return val;
}

// ─── Relationship Inference Engine ───────────────────────────────────────────
// Given who the ego (current user) is, and who a member is in the tree,
// figure out what role that member's CHILD / SPOUSE / PARENT would be to ego.

type EgoRelation =
  | "self"
  | "parent"        // mom or dad
  | "grandparent"   // grandma or grandpa
  | "great-grandparent"
  | "child"         // son or daughter
  | "grandchild"
  | "sibling"       // brother or sister
  | "aunt-uncle"    // parent's sibling
  | "cousin"
  | "niece-nephew"  // sibling's child
  | "spouse"
  | "parent-spouse" // parent's spouse (step-parent)
  | "unknown";

/**
 * BFS from ego to target, returning the relationship category of target to ego.
 */
function classifyRelationToEgo(
  egoId: string,
  targetId: string,
  members: TreeNodeData[]
): EgoRelation {
  if (egoId === targetId) return "self";

  const byId = new Map(members.map((m) => [m.id, m]));
  const ego = byId.get(egoId);
  if (!ego) return "unknown";

  // Helper: get parents of a member
  const parentsOf = (id: string): string[] => {
    const m = byId.get(id);
    if (!m) return [];
    const p: string[] = [];
    if (m.parent_id) p.push(m.parent_id);
    if (m.parent2_id) p.push(m.parent2_id);
    return p;
  };

  // Helper: get children of a member
  const childrenOf = (id: string): string[] =>
    members.filter((m) => m.parent_id === id || m.parent2_id === id).map((m) => m.id);

  // Direct checks
  const egoParents = parentsOf(egoId);
  const egoGrandparents = egoParents.flatMap(parentsOf);
  const egoGreatGrandparents = egoGrandparents.flatMap(parentsOf);
  const egoSiblings = members
    .filter((m) => m.id !== egoId && egoParents.length > 0 &&
      (egoParents.includes(m.parent_id ?? "") || egoParents.includes(m.parent2_id ?? "")))
    .map((m) => m.id);
  const egoChildren = childrenOf(egoId);

  // Is target a parent?
  if (egoParents.includes(targetId)) return "parent";

  // Is target a grandparent?
  if (egoGrandparents.includes(targetId)) return "grandparent";

  // Is target a great-grandparent?
  if (egoGreatGrandparents.includes(targetId)) return "great-grandparent";

  // Is target a sibling?
  if (egoSiblings.includes(targetId)) return "sibling";

  // Is target a child?
  if (egoChildren.includes(targetId)) return "child";

  // Is target a grandchild?
  const egoGrandchildren = egoChildren.flatMap(childrenOf);
  if (egoGrandchildren.includes(targetId)) return "grandchild";

  // Is target an aunt/uncle? (parent's sibling)
  const parentsOfParents = egoParents.flatMap(parentsOf);
  const auntsUncles = parentsOfParents.flatMap(childrenOf).filter(
    (id) => !egoParents.includes(id)
  );
  if (auntsUncles.includes(targetId)) return "aunt-uncle";

  // Is target a cousin? (aunt/uncle's child)
  const cousins = auntsUncles.flatMap(childrenOf);
  if (cousins.includes(targetId)) return "cousin";

  // Is target a niece/nephew? (sibling's child)
  const niecesNephews = egoSiblings.flatMap(childrenOf);
  if (niecesNephews.includes(targetId)) return "niece-nephew";

  // Is target ego's spouse?
  if (ego.spouse_id === targetId) return "spouse";

  // Is target a parent's spouse?
  for (const pid of egoParents) {
    const parent = byId.get(pid);
    if (parent?.spouse_id === targetId && !egoParents.includes(targetId)) {
      return "parent-spouse";
    }
  }

  return "unknown";
}

/**
 * Given the edited member's relationship to ego, infer what their CHILD would be to ego.
 */
function inferChildRelationship(parentRelation: EgoRelation): string {
  switch (parentRelation) {
    case "self":        return "none"; // ego's child — user should pick Son/Daughter
    case "parent":      return "none"; // parent's child = ego's sibling — but could be self
    case "grandparent": return "none"; // grandparent's child = ego's parent or aunt/uncle
    case "great-grandparent": return "none"; // too ambiguous
    case "sibling":     return "none"; // sibling's child = niece/nephew but need gender
    case "aunt-uncle":  return "Cousin";
    case "cousin":      return "none";
    case "spouse":      return "none"; // spouse's child = ego's child
    default:            return "none";
  }
}

/**
 * Given the edited member's relationship to ego, infer what their SPOUSE would be to ego.
 */
function inferSpouseRelationship(memberRelation: EgoRelation): string {
  switch (memberRelation) {
    case "parent":      return "none"; // parent's spouse = other parent or step-parent
    case "grandparent": return "none"; // grandparent's spouse = other grandparent
    case "sibling":     return "none"; // sibling's spouse = brother/sister-in-law
    case "aunt-uncle":  return "none"; // aunt/uncle's spouse = the other aunt/uncle
    case "child":       return "none";
    default:            return "none";
  }
}

/**
 * Given a member being edited and their relationship to ego,
 * auto-suggest the best relationship label for new children being added inline.
 * This is smarter than inferChildRelationship — it uses the actual relationship_label
 * of the member when available.
 */
function suggestChildLabel(
  editNode: TreeNodeData,
  egoRelation: EgoRelation,
  egoId: string,
  members: TreeNodeData[]
): string {
  const label = editNode.relationship_label?.toLowerCase() ?? "";

  // If we're editing a grandparent, their child is ego's parent or aunt/uncle
  if (egoRelation === "grandparent" || label === "grandmother" || label === "grandfather") {
    // Check if this grandparent's child is already ego's parent
    // If not, they're ego's aunt/uncle
    const egoNode = members.find((m) => m.id === egoId);
    if (egoNode) {
      // The child of a grandparent who isn't ego's parent = Uncle/Aunt
      // We can't know gender from inline add, so default to Uncle (most common first)
      return "Uncle";
    }
    return "Uncle";
  }

  // If editing ego's parent, their other child is ego's sibling
  if (egoRelation === "parent" || label === "mother" || label === "father") {
    return "Brother";
  }

  // If editing ego's aunt/uncle, their child is ego's cousin
  if (egoRelation === "aunt-uncle" || label === "aunt" || label === "uncle") {
    return "Cousin";
  }

  // If editing ego's sibling, their child is niece/nephew
  if (egoRelation === "sibling" || label === "brother" || label === "sister") {
    return "Nephew";
  }

  // If editing ego themselves, child = Son
  if (egoRelation === "self") {
    return "Son";
  }

  // If editing a cousin, their child = no standard label
  // If editing ego's child, their child = Grandchild
  if (egoRelation === "child" || label === "son" || label === "daughter") {
    return "Grandson";
  }

  return "none";
}

/**
 * Auto-suggest relationship label for the member being added/edited,
 * based on who their parents are set to.
 */
function suggestMemberLabel(
  parentId: string | null,
  parent2Id: string | null,
  egoId: string,
  members: TreeNodeData[]
): string {
  if (!parentId && !parent2Id) return "none";

  // Check each parent's relationship to ego
  const parentRelations: EgoRelation[] = [];
  if (parentId) parentRelations.push(classifyRelationToEgo(egoId, parentId, members));
  if (parent2Id) parentRelations.push(classifyRelationToEgo(egoId, parent2Id, members));

  for (const rel of parentRelations) {
    switch (rel) {
      case "self":        return "Son"; // ego's child
      case "parent":      return "Brother"; // parent's child = sibling
      case "grandparent": return "Uncle"; // grandparent's child
      case "great-grandparent": return "Grandfather"; // great-gp's child = gp
      case "sibling":     return "Nephew"; // sibling's child
      case "aunt-uncle":  return "Cousin";
      case "cousin":      return "none";
      case "spouse":      return "Son"; // spouse's child = ego's child too
    }
  }

  return "none";
}

// ─── Existing Connections Component ──────────────────────────────────────────
function ExistingConnections({
  editNode,
  members,
}: {
  editNode: TreeNodeData;
  members: TreeNodeData[];
}) {
  const byId = new Map(members.map((m) => [m.id, m]));

  const parent1 = editNode.parent_id ? byId.get(editNode.parent_id) : null;
  const parent2 = editNode.parent2_id ? byId.get(editNode.parent2_id) : null;
  const spouse = editNode.spouse_id ? byId.get(editNode.spouse_id) : null;
  const children = members.filter(
    (m) => m.parent_id === editNode.id || m.parent2_id === editNode.id
  );

  const hasAny = parent1 || parent2 || spouse || children.length > 0;
  if (!hasAny) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Current Connections
      </p>
      <div className="flex flex-wrap gap-1.5">
        {parent1 && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-background border rounded-full px-2.5 py-0.5">
            <Users className="h-3 w-3 text-muted-foreground" />
            {parent1.display_name}
            <span className="text-muted-foreground">
              ({parent1.relationship_label || "Parent"})
            </span>
          </span>
        )}
        {parent2 && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-background border rounded-full px-2.5 py-0.5">
            <Users className="h-3 w-3 text-muted-foreground" />
            {parent2.display_name}
            <span className="text-muted-foreground">
              ({parent2.relationship_label || "Parent"})
            </span>
          </span>
        )}
        {spouse && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 border rounded-full px-2.5 py-0.5">
            <Heart className="h-3 w-3 text-amber-500" />
            {spouse.display_name}
            <span className="text-muted-foreground">
              ({spouse.relationship_label || "Spouse"})
            </span>
          </span>
        )}
        {children.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 text-[11px] bg-background border rounded-full px-2.5 py-0.5"
          >
            <Baby className="h-3 w-3 text-muted-foreground" />
            {c.display_name}
            <span className="text-muted-foreground">
              ({c.relationship_label || "Child"})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────
export function AddTreeMemberDialog({
  open,
  onOpenChange,
  familyId,
  existingMembers,
  realMembers,
  editNode,
  currentUserMemberId,
}: AddTreeMemberDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editNode;

  // Find ego tree node
  const egoTreeId = useMemo(() => {
    if (!currentUserMemberId) return null;
    const egoTreeNode = existingMembers.find(
      (m) => m.linked_member_id === currentUserMemberId
    );
    return egoTreeNode?.id ?? null;
  }, [currentUserMemberId, existingMembers]);

  // Classify the edited node's relationship to ego
  const editNodeRelation = useMemo((): EgoRelation => {
    if (!egoTreeId || !editNode) return "unknown";
    return classifyRelationToEgo(egoTreeId, editNode.id, existingMembers);
  }, [egoTreeId, editNode, existingMembers]);

  // Suggested label for inline children of this node
  const suggestedChildLabel = useMemo(() => {
    if (!editNode || !egoTreeId) return "none";
    return suggestChildLabel(editNode, editNodeRelation, egoTreeId, existingMembers);
  }, [editNode, editNodeRelation, egoTreeId, existingMembers]);

  // ─── Main member fields ───
  const [displayName, setDisplayName] = useState("");
  const [connectionType, setConnectionType] = useState("dna");
  const [groupType, setGroupType] = useState<string>("family");
  const [relationshipLabel, setRelationshipLabel] = useState("none");
  const [parentId, setParentId] = useState("none");
  const [parent2Id, setParent2Id] = useState("none");
  const [spouseId, setSpouseId] = useState("none");
  const [birthYear, setBirthYear] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [linkedMemberId, setLinkedMemberId] = useState("none");

  // ─── Quick-add: create new spouse ───
  const [newSpouse, setNewSpouse] = useState<QuickAddPerson | null>(null);

  // ─── Quick-add: create new parents ───
  const [newParents, setNewParents] = useState<QuickAddPerson[]>([]);

  // ─── Quick-add: create new children ───
  const [newChildren, setNewChildren] = useState<QuickAddPerson[]>([]);

  // Sync form when dialog opens
  useEffect(() => {
    if (open) {
      setDisplayName(editNode?.display_name ?? "");
      setConnectionType(editNode?.connection_type ?? "dna");
      setGroupType(editNode?.group_type ?? "family");
      setRelationshipLabel(editNode?.relationship_label ?? "none");
      setParentId(editNode?.parent_id ?? "none");
      setParent2Id(editNode?.parent2_id ?? "none");
      setSpouseId(editNode?.spouse_id ?? "none");
      setBirthYear(editNode?.birth_year?.toString() ?? "");
      setIsDeceased(editNode?.is_deceased ?? false);
      setLinkedMemberId(editNode?.linked_member_id ?? "none");
      setNewSpouse(null);
      setNewParents([]);
      setNewChildren([]);
    }
  }, [open, editNode]);

  // Nudge group_type when connection_type changes via the picker below —
  // handled inline in the onClick so we don't need an effect that watches
  // its own state. A cousin who's also your coworker can still be toggled
  // manually in the Group select.
  const handleConnectionTypeChange = (value: string) => {
    setConnectionType(value);
    if (isEditing) return;
    if (value === "friend" && groupType === "family") setGroupType("friend");
    if (value === "dna" && groupType === "friend") setGroupType("family");
  };

  // Auto-suggest relationship label when parents change (add mode)
  useEffect(() => {
    if (isEditing || !egoTreeId) return;
    const pid = uuidOrNull(parentId);
    const p2id = uuidOrNull(parent2Id);
    if (!pid && !p2id) return;

    const suggested = suggestMemberLabel(pid, p2id, egoTreeId, existingMembers);
    if (suggested !== "none" && relationshipLabel === "none") {
      setRelationshipLabel(suggested);
    }
  }, [parentId, parent2Id, egoTreeId, existingMembers, isEditing, relationshipLabel]);

  // Filter out the editNode itself from selects
  const selectableMembers = useMemo(
    () => existingMembers.filter((m) => m.id !== editNode?.id),
    [existingMembers, editNode]
  );

  // Existing children of this node
  const existingChildren = useMemo(
    () =>
      isEditing
        ? existingMembers.filter(
            (m) =>
              m.parent_id === editNode?.id || m.parent2_id === editNode?.id
          )
        : [],
    [isEditing, existingMembers, editNode]
  );

  // ─── Quick-add helpers ───
  function addNewParent() {
    if (newParents.length >= 2) return;
    setNewParents((prev) => [...prev, { name: "", relationship: "none" }]);
  }

  function addNewChild() {
    // Auto-fill the suggested relationship label
    setNewChildren((prev) => [
      ...prev,
      { name: "", relationship: suggestedChildLabel },
    ]);
  }

  // ─── Submit handler ───
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    startTransition(async () => {
      try {
        if (isEditing && editNode) {
          // ── EDIT MODE ──

          // 1. Create new spouse if provided
          let finalSpouseId = uuidOrNull(spouseId);
          if (newSpouse && newSpouse.name.trim()) {
            const spouseResult = await addTreeMember({
              familyId,
              displayName: newSpouse.name.trim(),
              relationshipLabel:
                newSpouse.relationship === "none"
                  ? null
                  : newSpouse.relationship,
              parentId: null,
              spouseId: editNode.id,
              birthYear: null,
              isDeceased: false,
              connectionType: "spouse",
              groupType: "family",
            });
            if (!spouseResult.success) {
              toast.error(
                `Failed to add spouse: ${spouseResult.error}`
              );
              return;
            }
            finalSpouseId = spouseResult.id ?? null;
          }

          // 2. Create new children
          const validChildren = newChildren.filter((c) => c.name.trim());
          for (const child of validChildren) {
            const childParent2 =
              finalSpouseId ?? uuidOrNull(spouseId) ?? null;
            const childResult = await addTreeMember({
              familyId,
              displayName: child.name.trim(),
              relationshipLabel:
                child.relationship === "none" ? null : child.relationship,
              parentId: editNode.id,
              parent2Id: childParent2,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
              groupType: "family",
            });
            if (!childResult.success) {
              toast.error(
                `Failed to add child "${child.name}": ${childResult.error}`
              );
            }
          }

          // 3. Create new parents
          const validParents = newParents.filter((p) => p.name.trim());
          let createdParent1Id: string | null = uuidOrNull(parentId);
          let createdParent2Id: string | null = uuidOrNull(parent2Id);

          for (let i = 0; i < validParents.length; i++) {
            const p = validParents[i];
            const parentResult = await addTreeMember({
              familyId,
              displayName: p.name.trim(),
              relationshipLabel:
                p.relationship === "none" ? null : p.relationship,
              parentId: null,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
              groupType: "family",
            });
            if (!parentResult.success) {
              toast.error(
                `Failed to add parent "${p.name}": ${parentResult.error}`
              );
              return;
            }
            if (!createdParent1Id) {
              createdParent1Id = parentResult.id ?? null;
            } else if (!createdParent2Id) {
              createdParent2Id = parentResult.id ?? null;
            }
          }

          if (
            validParents.length === 2 &&
            createdParent1Id &&
            createdParent2Id
          ) {
            await updateTreeMember(createdParent1Id, {
              spouseId: createdParent2Id,
            });
          }

          // 4. Update the main member
          const result = await updateTreeMember(editNode.id, {
            displayName: displayName.trim(),
            relationshipLabel:
              relationshipLabel === "none" ? null : relationshipLabel,
            parentId: createdParent1Id,
            parent2Id: createdParent2Id,
            spouseId: finalSpouseId,
            birthYear: birthYear ? parseInt(birthYear, 10) : null,
            isDeceased,
            linkedMemberId: uuidOrNull(linkedMemberId),
            connectionType,
            groupType,
          });
          if (!result.success) {
            toast.error(result.error ?? "Failed to update member");
            return;
          }

          const extras =
            validChildren.length +
            validParents.length +
            (newSpouse?.name.trim() ? 1 : 0);
          toast.success(
            extras > 0
              ? `Member updated + ${extras} connection${extras > 1 ? "s" : ""} added`
              : "Member updated"
          );
        } else {
          // ── ADD MODE ──

          // 1. Create new parents
          let createdParent1Id: string | null = uuidOrNull(parentId);
          let createdParent2Id: string | null = uuidOrNull(parent2Id);

          const validParents = newParents.filter((p) => p.name.trim());
          for (let i = 0; i < validParents.length; i++) {
            const p = validParents[i];
            const parentResult = await addTreeMember({
              familyId,
              displayName: p.name.trim(),
              relationshipLabel:
                p.relationship === "none" ? null : p.relationship,
              parentId: null,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
              groupType: "family",
            });
            if (!parentResult.success) {
              toast.error(
                `Failed to add parent "${p.name}": ${parentResult.error}`
              );
              return;
            }
            if (i === 0 && !createdParent1Id) {
              createdParent1Id = parentResult.id ?? null;
            } else if (!createdParent2Id) {
              createdParent2Id = parentResult.id ?? null;
            }
          }

          if (
            validParents.length === 2 &&
            createdParent1Id &&
            createdParent2Id
          ) {
            await updateTreeMember(createdParent1Id, {
              spouseId: createdParent2Id,
            });
          }

          // 2. Create new spouse if inline
          let finalSpouseId = uuidOrNull(spouseId);
          if (newSpouse && newSpouse.name.trim()) {
            const spouseResult = await addTreeMember({
              familyId,
              displayName: newSpouse.name.trim(),
              relationshipLabel:
                newSpouse.relationship === "none"
                  ? null
                  : newSpouse.relationship,
              parentId: null,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
              connectionType: "spouse",
              groupType: "family",
            });
            if (!spouseResult.success) {
              toast.error(
                `Failed to add spouse: ${spouseResult.error}`
              );
              return;
            }
            finalSpouseId = spouseResult.id ?? null;
          }

          // 3. Create the main member
          const result = await addTreeMember({
            familyId,
            displayName: displayName.trim(),
            relationshipLabel:
              relationshipLabel === "none" ? null : relationshipLabel,
            parentId: createdParent1Id,
            parent2Id: createdParent2Id,
            spouseId: finalSpouseId,
            birthYear: birthYear ? parseInt(birthYear, 10) : null,
            isDeceased,
            connectionType,
            groupType,
          });
          if (!result.success) {
            toast.error(result.error ?? "Failed to add member");
            return;
          }
          const mainMemberId = result.id;

          if (finalSpouseId && mainMemberId) {
            await updateTreeMember(finalSpouseId, {
              spouseId: mainMemberId,
            });
          }

          // 4. Create children
          const validChildren = newChildren.filter((c) => c.name.trim());
          for (const child of validChildren) {
            const childResult = await addTreeMember({
              familyId,
              displayName: child.name.trim(),
              relationshipLabel:
                child.relationship === "none" ? null : child.relationship,
              parentId: mainMemberId ?? null,
              parent2Id: finalSpouseId,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
              groupType: "family",
            });
            if (!childResult.success) {
              toast.error(
                `Failed to add child "${child.name}": ${childResult.error}`
              );
            }
          }

          const totalAdded =
            1 +
            validParents.length +
            validChildren.length +
            (newSpouse?.name.trim() ? 1 : 0);
          toast.success(
            totalAdded === 1
              ? "Member added to tree"
              : `${totalAdded} members added to tree`
          );
        }
        onOpenChange(false);
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  // ─── Determine which parent slots are available ───
  const hasParent1 = parentId !== "none";
  const hasParent2 = parent2Id !== "none";
  const canAddNewParents =
    newParents.length <
    (hasParent1 && hasParent2 ? 0 : hasParent1 || hasParent2 ? 1 : 2);

  // Helper: describe what a child of the edited member would be to ego
  const childRoleHint = useMemo(() => {
    if (!editNode || !egoTreeId) return null;
    const label = editNode.relationship_label?.toLowerCase() ?? "";
    if (editNodeRelation === "grandparent" || label === "grandmother" || label === "grandfather")
      return "Their child would be your uncle/aunt";
    if (editNodeRelation === "parent" || label === "mother" || label === "father")
      return "Their child would be your sibling";
    if (editNodeRelation === "aunt-uncle" || label === "aunt" || label === "uncle")
      return "Their child would be your cousin";
    if (editNodeRelation === "sibling" || label === "brother" || label === "sister")
      return "Their child would be your niece/nephew";
    if (editNodeRelation === "self")
      return "Their child would be your son/daughter";
    if (editNodeRelation === "child" || label === "son" || label === "daughter")
      return "Their child would be your grandchild";
    return null;
  }, [editNode, egoTreeId, editNodeRelation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update info, add their spouse, children, or parents — all in one place."
              : "Add someone to your legacy hub. You can also add their spouse, parents, and children at the same time."}
          </DialogDescription>
        </DialogHeader>

        {/* ─── Existing connections context (edit mode) ─── */}
        {isEditing && editNode && (
          <ExistingConnections
            editNode={editNode}
            members={existingMembers}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ─── Name ─── */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Name *</Label>
            <Input
              id="displayName"
              placeholder="e.g. Grandma Rose"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          {/* ─── Connection Type ─── */}
          <div className="space-y-1.5">
            <Label>Connection Type</Label>
            <div className="flex gap-2">
              {[
                {
                  value: "dna",
                  label: "Family (DNA)",
                  desc: "Blood relative",
                },
                { value: "friend", label: "Friend", desc: "Non-family" },
                { value: "spouse", label: "Spouse", desc: "Partner" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleConnectionTypeChange(opt.value)}
                  className={`flex-1 rounded-lg border-2 p-2 text-center transition-colors ${
                    connectionType === opt.value
                      ? opt.value === "dna"
                        ? "border-primary bg-primary/5"
                        : opt.value === "friend"
                        ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                        : "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-xs font-semibold block">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── Group (drives sidebar filter views) ─── */}
          <div className="space-y-1.5">
            <Label>Group</Label>
            <Select value={groupType} onValueChange={setGroupType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Powers the sidebar filter views. A cousin you went to school with
              can be either — pick whichever network matters most.
            </p>
          </div>

          {/* ─── Relationship Label ─── */}
          <div className="space-y-1.5">
            <Label>Relationship Label</Label>
            <Select
              value={relationshipLabel}
              onValueChange={setRelationshipLabel}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No label</SelectItem>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ─── Parents Section ─── */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Parents
              </p>
              {canAddNewParents && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={addNewParent}
                >
                  <Plus className="h-3 w-3" />
                  Create New
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Parent 1
                </Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {selectableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Parent 2
                </Label>
                <Select value={parent2Id} onValueChange={setParent2Id}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {selectableMembers
                      .filter(
                        (m) => m.id !== parentId || parentId === "none"
                      )
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.display_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newParents.map((parent, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="New parent name"
                  value={parent.name}
                  onChange={(e) =>
                    setNewParents((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, name: e.target.value } : p
                      )
                    )
                  }
                  className="flex-1 h-8 text-sm"
                />
                <Select
                  value={parent.relationship}
                  onValueChange={(v) =>
                    setNewParents((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, relationship: v } : p
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No label</SelectItem>
                    {PARENT_RELATIONSHIP_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    setNewParents((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* ─── Spouse Section ─── */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-amber-500" />
                Spouse / Partner
              </p>
              {!newSpouse && spouseId === "none" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() =>
                    setNewSpouse({ name: "", relationship: "Spouse" })
                  }
                >
                  <UserPlus className="h-3 w-3" />
                  Create New
                </Button>
              )}
            </div>

            {!newSpouse && (
              <Select value={spouseId} onValueChange={setSpouseId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {selectableMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {newSpouse && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Spouse name"
                  value={newSpouse.name}
                  onChange={(e) =>
                    setNewSpouse({ ...newSpouse, name: e.target.value })
                  }
                  className="flex-1 h-8 text-sm"
                />
                <Select
                  value={newSpouse.relationship}
                  onValueChange={(v) =>
                    setNewSpouse({ ...newSpouse, relationship: v })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPOUSE_RELATIONSHIP_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setNewSpouse(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ─── Children Section ─── */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                Children
                {isEditing && existingChildren.length > 0 && (
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({existingChildren.length} existing)
                  </span>
                )}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={addNewChild}
              >
                <Plus className="h-3 w-3" />
                Add Child
              </Button>
            </div>

            {/* Hint about what the child would be to ego */}
            {childRoleHint && (
              <p className="text-[11px] text-primary/70 italic">
                💡 {childRoleHint}
              </p>
            )}

            {isEditing && existingChildren.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {existingChildren.map((c) => (
                  <span
                    key={c.id}
                    className="text-[10px] bg-background border rounded px-1.5 py-0.5 text-muted-foreground"
                  >
                    {c.display_name}
                  </span>
                ))}
              </div>
            )}

            {newChildren.length === 0 && !isEditing && (
              <p className="text-[11px] text-muted-foreground">
                No children added yet.
              </p>
            )}

            {newChildren.map((child, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Child name"
                  value={child.name}
                  onChange={(e) =>
                    setNewChildren((prev) =>
                      prev.map((c, i) =>
                        i === idx ? { ...c, name: e.target.value } : c
                      )
                    )
                  }
                  className="flex-1 h-8 text-sm"
                />
                <Select
                  value={child.relationship}
                  onValueChange={(v) =>
                    setNewChildren((prev) =>
                      prev.map((c, i) =>
                        i === idx ? { ...c, relationship: v } : c
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No label</SelectItem>
                    {CHILD_RELATIONSHIP_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    setNewChildren((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* ─── Birth Year + Deceased ─── */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="birthYear">Birth Year</Label>
              <Input
                id="birthYear"
                type="number"
                placeholder="e.g. 1948"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min={1800}
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-1.5 pt-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                  className="rounded border-input"
                />
                Deceased
              </label>
            </div>
          </div>

          {/* ─── Link to signed-up member ─── */}
          <div className="space-y-1.5">
            <Label>Link to Signed-Up Member</Label>
            <Select
              value={linkedMemberId}
              onValueChange={setLinkedMemberId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not linked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not linked</SelectItem>
                {realMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Link this tree node to someone who has signed up.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !displayName.trim()}>
              {isPending
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
