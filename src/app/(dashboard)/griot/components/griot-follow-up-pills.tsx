"use client";

interface GriotFollowUpPillsProps {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  "Tell me more about this",
  "Any related stories?",
  "What else has the family shared?",
];

export function GriotFollowUpPills({ onSelect }: GriotFollowUpPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3 ml-2">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-serif italic"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
