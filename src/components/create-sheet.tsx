"use client";

import Link from "next/link";
import {
  BookOpen,
  UtensilsCrossed,
  Wrench,
  Camera,
  FileUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const entryTypes = [
  {
    href: "/entries/new?type=story",
    label: "Story",
    description: "Share a family memory or narrative",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/entries/new?type=recipe",
    label: "Recipe",
    description: "Preserve a family recipe",
    icon: UtensilsCrossed,
    color: "text-orange-600 bg-orange-50",
  },
  {
    href: "/entries/new?type=skill",
    label: "Skill",
    description: "Document a skill or craft",
    icon: Wrench,
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/entries/new?type=memory",
    label: "Quick Memory",
    description: "Capture a quick moment",
    icon: Camera,
    color: "text-pink-600 bg-pink-50",
  },
  {
    href: "/griot?action=interview",
    label: "Import Interview",
    description: "Start a Griot-guided interview",
    icon: FileUp,
    color: "text-amber-600 bg-amber-50",
  },
] as const;

interface CreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSheet({ open, onOpenChange }: CreateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8" showCloseButton={false}>
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-4 pb-2">
          <SheetTitle className="text-lg">Create New Memory</SheetTitle>
          <SheetDescription>What would you like to preserve?</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 px-4">
          {entryTypes.map((entry) => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.label}
                href={entry.href}
                onClick={() => onOpenChange(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent transition-colors"
              >
                <span
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${entry.color}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-center leading-tight">
                  {entry.label}
                </span>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
