"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormSelector from "@/components/entry-forms/form-selector";
import RecipeForm from "@/components/entry-forms/recipe-form";
import ConnectionForm from "@/components/entry-forms/connection-form";
import SkillForm from "@/components/entry-forms/skill-form";
import StoryForm from "@/components/entry-forms/story-form";
import LessonForm from "@/components/entry-forms/lesson-form";
import GeneralForm from "./general-form";
import { createEntry, getUserFamilies } from "./actions";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import type { EntryType, EntryStructuredData } from "@/types/database";
import type { UserFamily } from "./actions";

export default function NewEntryPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [saving, setSaving] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);

  // Multi-family support
  const [families, setFamilies] = useState<UserFamily[]>([]);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]); // empty = all
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);

  useEffect(() => {
    setFamilyId(getActiveFamilyIdClient());
    getUserFamilies().then((fams) => {
      setFamilies(fams);
    });
  }, []);

  const isAllFamilies = selectedFamilyIds.length === 0;

  function toggleFamily(id: string) {
    setSelectedFamilyIds((prev) => {
      if (prev.length === 0) {
        // Currently "all" — switch to just this one unselected (select all others)
        return families.filter((f) => f.id !== id).map((f) => f.id);
      }
      if (prev.includes(id)) {
        const next = prev.filter((fid) => fid !== id);
        // If none selected, that means "all"
        return next;
      }
      const next = [...prev, id];
      // If all are now selected, switch to "all" (empty array)
      if (next.length === families.length) return [];
      return next;
    });
  }

  function selectAllFamilies() {
    setSelectedFamilyIds([]);
  }

  async function handleSubmit(data: {
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
    structured_data?: { type: string; data: any };
  }) {
    setSaving(true);
    try {
      const result = await createEntry({
        title: data.title,
        content: data.content,
        type: data.type,
        tags: data.tags,
        structured_data: data.structured_data as EntryStructuredData,
        familyIds: isAllFamilies ? undefined : selectedFamilyIds,
      });

      if (result?.data?.id) {
        router.push(`/entries/${result.data.id}`);
      } else {
        router.push("/entries");
      }
    } catch {
      router.push("/entries");
    } finally {
      setSaving(false);
    }
  }

  const familyLabel = isAllFamilies
    ? "All Families"
    : selectedFamilyIds.length === 1
      ? families.find((f) => f.id === selectedFamilyIds[0])?.name ?? "1 Family"
      : `${selectedFamilyIds.length} Families`;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/entries">
          <ArrowLeft className="size-4 mr-2" />
          Back to entries
        </Link>
      </Button>

      {!selectedType ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Create New Entry</h1>
            <p className="text-muted-foreground mt-1">
              What kind of family knowledge would you like to preserve?
            </p>
          </div>

          {/* Family selector */}
          {families.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFamilyPicker(!showFamilyPicker)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors w-full text-left"
              >
                <Users className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">
                  Sharing with: <span className="text-primary">{familyLabel}</span>
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${showFamilyPicker ? "rotate-180" : ""}`} />
              </button>

              {showFamilyPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-card shadow-lg z-10 p-2 space-y-1">
                  <button
                    type="button"
                    onClick={selectAllFamilies}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                      isAllFamilies
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {isAllFamilies && <Check className="size-3.5" />}
                    <span className={isAllFamilies ? "" : "ml-5"}>All Families</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Default
                    </Badge>
                  </button>
                  <div className="h-px bg-border my-1" />
                  {families.map((fam) => {
                    const isSelected =
                      isAllFamilies || selectedFamilyIds.includes(fam.id);
                    return (
                      <button
                        key={fam.id}
                        type="button"
                        onClick={() => toggleFamily(fam.id)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected && !isAllFamilies
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        {isSelected && !isAllFamilies ? (
                          <Check className="size-3.5" />
                        ) : (
                          <span className="w-3.5" />
                        )}
                        <span>{fam.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <FormSelector onSelect={setSelectedType} />
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedType(null)}
            className="-ml-2"
          >
            <ArrowLeft className="size-4 mr-2" />
            Choose a different type
          </Button>

          {/* Show family context reminder */}
          {families.length > 1 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              Sharing with: <span className="font-medium text-foreground">{familyLabel}</span>
            </div>
          )}

          {selectedType === "recipe" && (
            <RecipeForm onSubmit={handleSubmit} saving={saving} familyId={familyId ?? undefined} />
          )}
          {selectedType === "connection" && (
            <ConnectionForm onSubmit={handleSubmit} saving={saving} />
          )}
          {selectedType === "skill" && (
            <SkillForm onSubmit={handleSubmit} saving={saving} familyId={familyId ?? undefined} />
          )}
          {selectedType === "story" && (
            <StoryForm onSubmit={handleSubmit} saving={saving} familyId={familyId ?? undefined} />
          )}
          {selectedType === "lesson" && (
            <LessonForm onSubmit={handleSubmit} saving={saving} familyId={familyId ?? undefined} />
          )}
          {selectedType === "general" && (
            <GeneralForm onSubmit={handleSubmit} saving={saving} />
          )}
        </div>
      )}
    </div>
  );
}
