"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";

interface MatureToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function MatureToggle({ checked, onCheckedChange }: MatureToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
      <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
      <Label
        htmlFor="mature-toggle"
        className="text-sm text-muted-foreground cursor-pointer flex-1"
      >
        Contains mature content (21+)
      </Label>
      <Switch
        id="mature-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
