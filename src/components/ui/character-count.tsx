import { cn } from "@/lib/utils";

interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCount({ current, max, className }: CharacterCountProps) {
  const ratio = current / max;
  return (
    <p
      className={cn(
        "text-xs text-right tabular-nums",
        ratio >= 1
          ? "text-destructive font-medium"
          : ratio >= 0.85
          ? "text-amber-500"
          : "text-muted-foreground",
        className
      )}
    >
      {current}/{max}
    </p>
  );
}
