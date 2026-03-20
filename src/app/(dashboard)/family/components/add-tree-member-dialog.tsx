"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import type { TreeNodeData } from "./family-tree-node";

const RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandmother",
  "Grandfather",
  "Grandson",
  "Granddaughter",
  "Aunt",
  "Uncle",
  "Cousin",
  "Niece",
  "Nephew",
  "Spouse",
  "Partner",
  "Friend",
  "Other",
] as const;

const PARENT_RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Grandmother",
  "Grandfather",
] as const;

const CHILD_RELATIONSHIP_OPTIONS = [
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandson",
  "Granddaughter",
  "Niece",
  "Nephew",
  "Cousin",
] as const;

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
  /** If provided, the dialog is in edit mode */
  editNode?: TreeNodeData | null;
}

/** Convert "none" or empty string to null for UUID fields */
function uuidOrNull(val: string): string | null {
  if (!val || val === "none") return null;
  return val;
}

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
  const [relationshipLabel, setRelationshipLabel] = useState("none");
  const [parentId, setParentId] = useState("none");
  const [parent2Id, setParent2Id] = useState("none");
  const [spouseId, setSpouseId] = useState("none");
  const [birthYear, setBirthYear] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [linkedMemberId, setLinkedMemberId] = useState("none");

  // ─── Quick-add parents (create new, not select existing) ───
  const [showParents, setShowParents] = useState(false);
  const [newParents, setNewParents] = useState<QuickAddPerson[]>([]);

  // ─── Quick-add children ───
  const [showChildren, setShowChildren] = useState(false);
  const [newChildren, setNewChildren] = useState<QuickAddPerson[]>([]);

  // Sync form with editNode whenever dialog opens or editNode changes
  useEffect(() => {
    if (open) {
      setDisplayName(editNode?.display_name ?? "");
      setRelationshipLabel(editNode?.relationship_label ?? "none");
      setParentId(editNode?.parent_id ?? "none");
      setParent2Id(editNode?.parent2_id ?? "none");
      setSpouseId(editNode?.spouse_id ?? "none");
      setBirthYear(editNode?.birth_year?.toString() ?? "");
      setIsDeceased(editNode?.is_deceased ?? false);
      setLinkedMemberId(editNode?.linked_member_id ?? "none");
      setNewParents([]);
      setNewChildren([]);
      setShowParents(false);
      setShowChildren(false);
    }
  }, [open, editNode]);

  function addNewParent() {
    if (newParents.length >= 2) return; // max 2 parents
    setNewParents((prev) => [...prev, { name: "", relationship: "none" }]);
    setShowParents(true);
  }

  function removeNewParent(index: number) {
    setNewParents((prev) => prev.filter((_, i) => i !== index));
  }

  function updateNewParent(index: number, field: keyof QuickAddPerson, value: string) {
    setNewParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function addNewChild() {
    setNewChildren((prev) => [...prev, { name: "", relationship: "none" }]);
    setShowChildren(true);
  }

  function removeNewChild(index: number) {
    setNewChildren((prev) => prev.filter((_, i) => i !== index));
  }

  function updateNewChild(index: number, field: keyof QuickAddPerson, value: string) {
    setNewChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    startTransition(async () => {
      try {
        if (isEditing && editNode) {
          // ─── Edit mode: just update the member ───
          const result = await updateTreeMember(editNode.id, {
            displayName: displayName.trim(),
            relationshipLabel: relationshipLabel === "none" ? null : relationshipLabel,
            parentId: uuidOrNull(parentId),
            parent2Id: uuidOrNull(parent2Id),
            spouseId: uuidOrNull(spouseId),
            birthYear: birthYear ? parseInt(birthYear, 10) : null,
            isDeceased,
            linkedMemberId: uuidOrNull(linkedMemberId),
          });
          if (!result.success) {
            toast.error(result.error ?? "Failed to update member");
            return;
          }
          toast.success("Member updated");
        } else {
          // ─── Add mode: create parents first, then member, then children ───

          // 1. Create new parents (if any)
          let createdParent1Id: string | null = uuidOrNull(parentId);
          let createdParent2Id: string | null = uuidOrNull(parent2Id);

          const validParents = newParents.filter((p) => p.name.trim());
          for (let i = 0; i < validParents.length; i++) {
            const p = validParents[i];
            const parentResult = await addTreeMember({
              familyId,
              displayName: p.name.trim(),
              relationshipLabel: p.relationship === "none" ? null : p.relationship,
              parentId: null,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
            });
            if (!parentResult.success) {
              toast.error(`Failed to add parent "${p.name}": ${parentResult.error}`);
              return;
            }
            // Assign the created parent ID
            if (i === 0 && !createdParent1Id) {
              createdParent1Id = parentResult.id ?? null;
            } else if (!createdParent2Id) {
              createdParent2Id = parentResult.id ?? null;
            }
          }

          // If we created 2 parents, link them as spouses
          if (validParents.length === 2 && createdParent1Id && createdParent2Id) {
            await updateTreeMember(createdParent1Id, { spouseId: createdParent2Id });
          }

          // 2. Create the main member
          const result = await addTreeMember({
            familyId,
            displayName: displayName.trim(),
            relationshipLabel: relationshipLabel === "none" ? null : relationshipLabel,
            parentId: createdParent1Id,
            parent2Id: createdParent2Id,
            spouseId: uuidOrNull(spouseId),
            birthYear: birthYear ? parseInt(birthYear, 10) : null,
            isDeceased,
          });
          if (!result.success) {
            toast.error(result.error ?? "Failed to add member");
            return;
          }
          const mainMemberId = result.id;

          // 3. Create children (with this member as parent)
          const validChildren = newChildren.filter((c) => c.name.trim());
          for (const child of validChildren) {
            const childResult = await addTreeMember({
              familyId,
              displayName: child.name.trim(),
              relationshipLabel: child.relationship === "none" ? null : child.relationship,
              parentId: mainMemberId ?? null,
              spouseId: null,
              birthYear: null,
              isDeceased: false,
            });
            if (!childResult.success) {
              toast.error(`Failed to add child "${child.name}": ${childResult.error}`);
            }
          }

          const totalAdded = 1 + validParents.length + validChildren.length;
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

  // Filter out the editNode itself from parent/spouse selects
  const selectableMembers = existingMembers.filter(
    (m) => m.id !== editNode?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this member\u2019s info \u2014 correct names, change relationships, mark as deceased, or update after a divorce."
              : "Add someone to your family tree. You can also add their parents and children at the same time."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
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

          {/* Relationship */}
          <div className="space-y-1.5">
            <Label>Relationship (to you)</Label>
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

          {/* Parent (existing) */}
          <div className="space-y-1.5">
            <Label>Parent (in tree)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None (root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (root)</SelectItem>
                {selectableMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent 2 (existing) */}
          <div className="space-y-1.5">
            <Label>Parent 2 (Other Parent)</Label>
            <Select value={parent2Id} onValueChange={setParent2Id}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {selectableMembers
                  .filter((m) => m.id !== parentId || parentId === "none")
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* ─── Quick-Add Parents (create new) ─── */}
          {!isEditing && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium w-full text-left"
                onClick={() => setShowParents(!showParents)}
              >
                {showParents ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Create New Parents
                {newParents.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {newParents.length} added
                  </span>
                )}
              </button>

              {showParents && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    Create parents that don&apos;t exist in the tree yet. They&apos;ll be linked automatically.
                  </p>

                  {newParents.map((parent, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Parent name"
                        value={parent.name}
                        onChange={(e) => updateNewParent(idx, "name", e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                      <Select
                        value={parent.relationship}
                        onValueChange={(v) => updateNewParent(idx, "relationship", v)}
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
                        onClick={() => removeNewParent(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {newParents.length < 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={addNewParent}
                    >
                      <Plus className="h-3 w-3" />
                      Add {newParents.length === 0 ? "Parent" : "2nd Parent"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Spouse */}
          <div className="space-y-1.5">
            <Label>Spouse / Partner</Label>
            <Select value={spouseId} onValueChange={setSpouseId}>
              <SelectTrigger className="w-full">
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

          {/* ─── Quick-Add Children ─── */}
          {!isEditing && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium w-full text-left"
                onClick={() => setShowChildren(!showChildren)}
              >
                {showChildren ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Add Children
                {newChildren.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {newChildren.length} added
                  </span>
                )}
              </button>

              {showChildren && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    Add children of this person. They&apos;ll be connected automatically.
                  </p>

                  {newChildren.map((child, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Child name"
                        value={child.name}
                        onChange={(e) => updateNewChild(idx, "name", e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                      <Select
                        value={child.relationship}
                        onValueChange={(v) => updateNewChild(idx, "relationship", v)}
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
                        onClick={() => removeNewChild(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

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
              )}
            </div>
          )}

          {/* Birth Year + Deceased row */}
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

          {/* Link to real member (always shown in edit mode) */}
          {isEditing && (
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
          )}

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
