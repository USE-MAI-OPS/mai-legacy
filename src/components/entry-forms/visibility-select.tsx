"use client";

import { Globe, Link2, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EntryVisibility } from "@/types/database";

const visibilityOptions: {
  value: EntryVisibility;
  label: string;
  description: string;
  icon: typeof Globe;
}[] = [
  {
    value: "family",
    label: "Family Only",
    description: "Only family members can see this",
    icon: Users,
  },
  {
    value: "link",
    label: "Anyone with link",
    description: "Anyone with the link can view",
    icon: Link2,
  },
  {
    value: "public",
    label: "Public",
    description: "Visible on the explore page",
    icon: Globe,
  },
];

interface VisibilitySelectProps {
  value: EntryVisibility;
  onChange: (value: EntryVisibility) => void;
}

export function VisibilitySelect({ value, onChange }: VisibilitySelectProps) {
  const selected = visibilityOptions.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="visibility">Visibility</Label>
      <Select value={value} onValueChange={(v) => onChange(v as EntryVisibility)}>
        <SelectTrigger id="visibility" className="w-full">
          <SelectValue placeholder="Select visibility">
            {selected && (
              <span className="flex items-center gap-2">
                <selected.icon className="size-4 text-muted-foreground" />
                {selected.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {visibilityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <opt.icon className="size-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {opt.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
