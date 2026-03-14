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
  "Other",
] as const;

interface RealMember {
  id: string;
  display_name: string;
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

  const [displayName, setDisplayName] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("none");
  const [parentId, setParentId] = useState("none");
  const [parent2Id, setParent2Id] = useState("none");
  const [spouseId, setSpouseId] = useState("none");
  const [birthYear, setBirthYear] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [linkedMemberId, setLinkedMemberId] = useState("none");

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
    }
  }, [open, editNode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    startTransition(async () => {
      try {
        if (isEditing && editNode) {
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
          const result = await addTreeMember({
            familyId,
            displayName: displayName.trim(),
            relationshipLabel: relationshipLabel === "none" ? null : relationshipLabel,
            parentId: uuidOrNull(parentId),
            parent2Id: uuidOrNull(parent2Id),
            spouseId: uuidOrNull(spouseId),
            birthYear: birthYear ? parseInt(birthYear, 10) : null,
            isDeceased,
          });
          if (!result.success) {
            toast.error(result.error ?? "Failed to add member");
            return;
          }
          toast.success("Member added to tree");
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
              : "Add someone to your family tree. They can claim their node when they sign up."}
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
            <Label>Relationship</Label>
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

          {/* Parent */}
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

          {/* Parent 2 */}
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
