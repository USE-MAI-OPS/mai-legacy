/**
 * User-facing labels for the "memories" concept.
 * Internally, code still uses "entry" / "entries" — these labels
 * are for rendering in the UI only.
 */
export const MEMORY_LABELS = {
  singular: "Memory",
  plural: "Memories",
  addNew: "Add a Memory",
  allItems: "All Memories",
  createNew: "New Memory",
  noItems: "No memories yet",
  noItemsDescription: "Start preserving your family's knowledge by adding your first memory.",
} as const;
