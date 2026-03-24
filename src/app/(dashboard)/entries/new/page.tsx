"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormSelector from "@/components/entry-forms/form-selector";
import RecipeForm from "@/components/entry-forms/recipe-form";
import ConnectionForm from "@/components/entry-forms/connection-form";
import SkillForm from "@/components/entry-forms/skill-form";
import StoryForm from "@/components/entry-forms/story-form";
import LessonForm from "@/components/entry-forms/lesson-form";
import GeneralForm from "./general-form";
import { VisibilitySelect } from "@/components/entry-forms/visibility-select";
import { createEntry } from "./actions";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import type { EntryType, EntryStructuredData, EntryVisibility } from "@/types/database";

export default function NewEntryPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<EntryVisibility>("family");

  useEffect(() => {
    setFamilyId(getActiveFamilyIdClient());
  }, []);

  async function handleSubmit(data: {
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
    structured_data?: { type: string; data: any };
    is_mature?: boolean;
  }) {
    setSaving(true);
    try {
      const result = await createEntry({
        title: data.title,
        content: data.content,
        type: data.type,
        tags: data.tags,
        structured_data: data.structured_data as EntryStructuredData,
        is_mature: data.is_mature,
        visibility,
      });

      setNavigating(true);
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

  return (
    <>
    {navigating && (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">Saving your entry...</p>
      </div>
    )}
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

          <div className="px-1">
            <VisibilitySelect value={visibility} onChange={setVisibility} />
          </div>

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
    </>
  );
}
