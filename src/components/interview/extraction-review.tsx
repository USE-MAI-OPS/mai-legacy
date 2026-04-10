"use client";

import { useState, useMemo } from "react";
import { CheckSquare, Square, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryReviewCard } from "./entry-review-card";
import { ProfileUpdatesSection } from "./profile-updates-section";
import { FollowupSuggestions } from "./followup-suggestions";
import type {
  ExtractionResult,
  ReviewableEntry,
  ExtractedProfileUpdates,
} from "@/lib/interview/types";

interface ExtractionReviewProps {
  result: ExtractionResult;
  subjectName: string;
  onSave: (
    entries: ReviewableEntry[],
    profileUpdates: ExtractedProfileUpdates,
    selectedProfileKeys: Record<string, boolean>
  ) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ExtractionReview({
  result,
  subjectName,
  onSave,
  onCancel,
  isSaving,
}: ExtractionReviewProps) {
  // Initialize reviewable entries with unique IDs
  const [entries, setEntries] = useState<ReviewableEntry[]>(() =>
    result.entries.map((entry, index) => ({
      ...entry,
      id: `ext-${index}-${Date.now()}`,
      selected: true,
      expanded: false,
    }))
  );

  // Track which profile updates are selected (default all selected)
  const [selectedProfileItems, setSelectedProfileItems] = useState<
    Record<string, boolean>
  >({});

  // Computed counts
  const selectedEntryCount = entries.filter((e) => e.selected).length;
  const totalEntryCount = entries.length;

  const profileItemCount = useMemo(() => {
    let count = 0;
    for (const [category, value] of Object.entries(result.profile_updates)) {
      if (Array.isArray(value)) {
        value.forEach((_, index) => {
          const key = `${category}.${index}`;
          if (selectedProfileItems[key] !== false) count++;
        });
      } else if (category === "military" && value !== null) {
        if (selectedProfileItems["military.0"] !== false) count++;
      }
    }
    return count;
  }, [result.profile_updates, selectedProfileItems]);

  // Entry actions
  function handleToggleSelect(id: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleUpdateTitle(id: string, title: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, title } : e))
    );
  }

  function handleUpdateContent(id: string, content: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, content } : e))
    );
  }

  function handleSelectAll() {
    setEntries((prev) => prev.map((e) => ({ ...e, selected: true })));
  }

  function handleDeselectAll() {
    setEntries((prev) => prev.map((e) => ({ ...e, selected: false })));
  }

  function handleToggleProfileItem(key: string) {
    setSelectedProfileItems((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  }

  function handleSave() {
    const selectedEntries = entries.filter((e) => e.selected);
    onSave(selectedEntries, result.profile_updates, selectedProfileItems);
  }

  if (totalEntryCount === 0 && profileItemCount === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 space-y-4">
        <p className="text-lg text-muted-foreground">
          We couldn&apos;t find specific stories, recipes, or lessons in this
          transcript.
        </p>
        <p className="text-sm text-muted-foreground">
          Try a more focused conversation, or add entries manually.
        </p>
        <Button variant="outline" onClick={onCancel} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Found {totalEntryCount} {totalEntryCount === 1 ? "memory" : "memories"}
          {profileItemCount > 0 && ` and ${profileItemCount} profile updates`}
        </h2>
        <p className="text-sm text-muted-foreground">
          Review what was extracted from the conversation with {subjectName}.
          Edit titles, deselect items you don&apos;t want, then save.
        </p>
      </div>

      {/* Bulk Actions Bar */}
      {totalEntryCount > 0 && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2 border border-border">
          <span className="text-sm text-muted-foreground">
            {selectedEntryCount} of {totalEntryCount}{" "}
            {totalEntryCount === 1 ? "memory" : "memories"} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs gap-1"
            >
              <CheckSquare className="w-3 h-3" />
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="text-xs gap-1"
            >
              <Square className="w-3 h-3" />
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Entry Cards */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <EntryReviewCard
            key={entry.id}
            entry={entry}
            onToggleSelect={handleToggleSelect}
            onRemove={handleRemove}
            onUpdateTitle={handleUpdateTitle}
            onUpdateContent={handleUpdateContent}
          />
        ))}
      </div>

      {/* Profile Updates */}
      <ProfileUpdatesSection
        subjectName={subjectName}
        updates={result.profile_updates}
        selectedItems={selectedProfileItems}
        onToggleItem={handleToggleProfileItem}
      />

      {/* Follow-up Suggestions */}
      <FollowupSuggestions suggestions={result.suggested_followups} />

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border -mx-4 px-4 py-4 mt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Saving {selectedEntryCount}{" "}
              {selectedEntryCount === 1 ? "memory" : "memories"}
              {profileItemCount > 0 &&
                ` and ${profileItemCount} profile ${
                  profileItemCount === 1 ? "update" : "updates"
                }`}
            </span>
            <Button
              onClick={handleSave}
              disabled={
                isSaving || (selectedEntryCount === 0 && profileItemCount === 0)
              }
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Selected
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
