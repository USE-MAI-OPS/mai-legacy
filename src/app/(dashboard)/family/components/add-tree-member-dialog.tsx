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
  "Aunt", "Uncle", "Cousin", "Niece", "Nephew",
  "Spouse", "Partner", "Step-Mother", "Step-Father",
  "Step-Son", "Step-Daughter", "Half-Brother", "Half-Sister",
  "Friend", "Godparent", "Godchild", "Other",
] as const;

const PARENT_RELATIONSHIP_OPTIONS = [
  "Mother", "Father", "Grandmother", "Grandfather",
  "Step-Mother", "Step-Father", "Godparent",
] as const;

const CHILD_RELATIONSHIP_OPTIONS = [
  "Son", "Daughter", "Grandson", "Granddaughter",
  "Step-Son", "Step-Daughter", "Godchild",
  "Niece", "Nephew", "Cousin",
] as const;

const SPOUSE_RELATIONSHIP_OPTIONS = [
  "Spouse", "Partner",
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
}

function uuidOrNull(val: string): string | null {
  if (!val || val === "none") return null;
  return val;
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
}: AddTreeMemberDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editNode;

  // ─── Main member fields ───
  const [displayName, setDisplayName] = useState("");
  const [connectionType, setConnectionType] = useState("dna");
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

  // Filter out the editNode itself from selects
  const selectableMembers = useMemo(
    () => existingMembers.filter((m) => m.id !== editNode?.id),
    [existingMembers, editNode]
  );

  // Existing children of this node (for edit context)
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
    setNewChildren((prev) => [...prev, { name: "", relationship: "none" }]);
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
              spouseId: editNode.id, // link back to this member
              birthYear: null,
              isDeceased: false,
              connectionType: "spouse",
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
            // If this member has a spouse, add as parent2
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

          // Link created parents as spouses if we made 2
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

          // Link created parents as spouses
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
          });
          if (!result.success) {
            toast.error(result.error ?? "Failed to add member");
            return;
          }
          const mainMemberId = result.id;

          // If we created spouse inline, link them back
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
    newParents.length < (hasParent1 && hasParent2 ? 0 : hasParent1 || hasParent2 ? 1 : 2);

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
                { value: "dna", label: "Family (DNA)", desc: "Blood relative" },
                { value: "friend", label: "Friend", desc: "Non-family" },
                { value: "spouse", label: "Spouse", desc: "Partner" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConnectionType(opt.value)}
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

            {/* Existing parent selects */}
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

            {/* Quick-create parents */}
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

            {/* Existing spouse select */}
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

            {/* Quick-create spouse */}
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

            {/* Show existing children names in edit mode */}
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
