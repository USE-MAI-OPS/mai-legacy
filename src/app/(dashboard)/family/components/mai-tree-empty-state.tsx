"use client";

import { Plus, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Radial placeholder data
// ---------------------------------------------------------------------------
const PLACEHOLDERS = [
  { label: "Add Parent", angle: 270 },
  { label: "Add Sibling", angle: 330 },
  { label: "Add Friend", angle: 30 },
  { label: "Add Partner", angle: 90 },
  { label: "Add Mentor", angle: 150 },
  { label: "Add Other", angle: 210 },
] as const;

const RADIUS = 140;
const CENTER = 200; // center of the 400x400 visualization area

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MaiTreeEmptyStateProps {
  currentUserDisplayName: string | null;
  onAddNew: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MaiTreeEmptyState({
  currentUserDisplayName,
  onAddNew,
}: MaiTreeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-8 relative">
      {/* Radial visualization */}
      <div className="relative" style={{ width: CENTER * 2, height: CENTER * 2 }}>
        {/* SVG dashed lines from center to each placeholder */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CENTER * 2}
          height={CENTER * 2}
        >
          {PLACEHOLDERS.map((p) => {
            const px = CENTER + Math.cos(toRad(p.angle)) * RADIUS;
            const py = CENTER + Math.sin(toRad(p.angle)) * RADIUS;
            return (
              <line
                key={p.label}
                x1={CENTER}
                y1={CENTER}
                x2={px}
                y2={py}
                stroke="oklch(0.55 0.15 45 / 0.25)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center: User avatar with YOU badge */}
        <div
          className="absolute flex flex-col items-center gap-1"
          style={{
            left: CENTER - 40,
            top: CENTER - 40,
            width: 80,
          }}
        >
          <div className="relative">
            <Avatar className="h-20 w-20 ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/25">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {currentUserDisplayName
                  ? getInitials(currentUserDisplayName)
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-2.5 py-[1px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold tracking-widest shadow-sm uppercase">
              You
            </span>
          </div>
        </div>

        {/* Radial placeholder buttons */}
        {PLACEHOLDERS.map((p) => {
          const px = CENTER + Math.cos(toRad(p.angle)) * RADIUS;
          const py = CENTER + Math.sin(toRad(p.angle)) * RADIUS;
          return (
            <button
              key={p.label}
              onClick={onAddNew}
              className="absolute flex flex-col items-center gap-1.5 group"
              style={{
                left: px - 32,
                top: py - 32,
                width: 64,
              }}
            >
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center transition-colors group-hover:border-primary group-hover:bg-primary/5">
                <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground/70 whitespace-nowrap group-hover:text-primary transition-colors">
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA section below visualization */}
      <div className="text-center space-y-3 max-w-sm">
        <h2 className="text-xl font-serif font-bold">
          Start Your People Network
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Add the people who matter most — family, friends, mentors, and more.
          The Griot will help you discover connections and stories.
        </p>
        <Button onClick={onAddNew} className="rounded-full" size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Person
        </Button>
        <p className="text-xs text-muted-foreground">
          <button
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            onClick={onAddNew}
          >
            Or import from contacts
          </button>
        </p>
      </div>

      {/* Griot tip bubble — decorative, bottom-right */}
      <div className="absolute bottom-6 right-6 max-w-[220px] hidden md:flex items-start gap-2.5">
        <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-orange-500" />
        </div>
        <div className="bg-card border rounded-xl rounded-tl-none px-3 py-2 shadow-sm">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            &ldquo;Start with your parents — they usually have the best
            stories!&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
