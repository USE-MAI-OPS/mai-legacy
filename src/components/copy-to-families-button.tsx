"use client";

import { useState, useTransition, useEffect } from "react";
import { Copy, Loader2, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyEntryToFamilies } from "@/app/(dashboard)/entries/[id]/actions";
import { getUserFamilies, type UserFamily } from "@/app/(dashboard)/entries/new/actions";

interface CopyToFamiliesButtonProps {
  entryId: string;
  currentFamilyId: string;
}

export function CopyToFamiliesButton({
  entryId,
  currentFamilyId,
}: CopyToFamiliesButtonProps) {
  const [open, setOpen] = useState(false);
  const [families, setFamilies] = useState<UserFamily[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // Load families when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getUserFamilies()
      .then((fams) => {
        // Exclude the current family
        const otherFamilies = fams.filter((f) => f.id !== currentFamilyId);
        setFamilies(otherFamilies);
        // Select all by default
        setSelected(new Set(otherFamilies.map((f) => f.id)));
      })
      .finally(() => setLoading(false));
  }, [open, currentFamilyId]);

  function toggleFamily(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(families.map((f) => f.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function handleCopy() {
    if (selected.size === 0) {
      toast.error("Select at least one family");
      return;
    }

    startTransition(async () => {
      const result = await copyEntryToFamilies(entryId, Array.from(selected));
      if (result.success) {
        toast.success(
          `Copied to ${result.copiedCount} ${
            result.copiedCount === 1 ? "family" : "families"
          }`
        );
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to copy entry");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="size-4 mr-2" />
          Copy to Families
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy to Other Families</DialogTitle>
          <DialogDescription>
            Select which families to copy this entry to. A separate copy will be
            created in each selected family.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : families.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              You only belong to one family. Join or create another family to
              copy entries between them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select all / none */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selected.size} of {families.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  All
                </button>
                <span className="text-xs text-muted-foreground">/</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-primary hover:underline"
                >
                  None
                </button>
              </div>
            </div>

            {/* Family list */}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {families.map((fam) => (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => toggleFamily(fam.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                    selected.has(fam.id)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected.has(fam.id)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selected.has(fam.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="truncate">{fam.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          {families.length > 0 && (
            <Button
              onClick={handleCopy}
              disabled={isPending || selected.size === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to {selected.size}{" "}
                  {selected.size === 1 ? "Family" : "Families"}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
