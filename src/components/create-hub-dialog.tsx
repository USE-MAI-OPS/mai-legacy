"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CircleDot } from "lucide-react";
import { createFamily } from "@/app/(auth)/actions";
import { setActiveFamilyIdClient } from "@/lib/active-family";
import { cn } from "@/lib/utils";

interface CreateHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHubDialog({ open, onOpenChange }: CreateHubDialogProps) {
  const router = useRouter();
  const [hubType, setHubType] = useState<"family" | "circle">("family");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !displayName.trim()) return;
    setLoading(true);
    setError(null);

    const result = await createFamily(name.trim(), displayName.trim(), undefined, undefined, hubType);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.familyId) {
      setActiveFamilyIdClient(result.familyId);
    }

    onOpenChange(false);
    setName("");
    setDisplayName("");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Hub</DialogTitle>
          <DialogDescription>
            Create a family hub for relatives or a circle for friends, mentors, and other groups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setHubType("family")}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-left",
                hubType === "family"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <Users className="h-5 w-5 shrink-0" />
              <div>
                <div className="font-medium text-sm">Family</div>
                <div className="text-xs text-muted-foreground">Blood relatives & family</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setHubType("circle")}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-left",
                hubType === "circle"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <CircleDot className="h-5 w-5 shrink-0" />
              <div>
                <div className="font-medium text-sm">Circle</div>
                <div className="text-xs text-muted-foreground">Friends, mentors, groups</div>
              </div>
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hub-name">
              {hubType === "family" ? "Family Name" : "Circle Name"}
            </Label>
            <Input
              id="hub-name"
              placeholder={hubType === "family" ? "e.g. The Powells" : "e.g. College Friends"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Your Display Name</Label>
            <Input
              id="display-name"
              placeholder="How should others know you here?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!name.trim() || !displayName.trim() || loading}
          >
            {loading ? "Creating..." : `Create ${hubType === "family" ? "Family" : "Circle"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
