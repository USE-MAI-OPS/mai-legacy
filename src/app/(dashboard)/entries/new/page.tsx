"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createEntry } from "./actions";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import { useFamilyContext } from "@/components/providers/family-provider";
import type { EntryType, EntryStructuredData, EntryVisibility } from "@/types/database";

const VALID_TYPES: ReadonlyArray<EntryType> = [
  "recipe",
  "story",
  "skill",
  "lesson",
  "connection",
  "general",
];

function parseTypeParam(value: string | null): EntryType | null {
  if (!value) return null;
  return (VALID_TYPES as readonly string[]).includes(value)
    ? (value as EntryType)
    : null;
}

export default function NewEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = parseTypeParam(searchParams.get("type"));
  const [selectedType, setSelectedType] = useState<EntryType | null>(initialType);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<EntryVisibility>("family");
  // Default ON — authors' entries flow into every hub they're in
  // unless they explicitly opt out here.
  const [shareAcrossHubs, setShareAcrossHubs] = useState(true);

  const { hubs } = useFamilyContext();
  const hasMultipleHubs = hubs.length > 1;

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
        share_across_hubs: shareAcrossHubs,
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
        <p className="text-lg font-medium">Saving your memory...</p>
      </div>
    )}
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/entries">
          <ArrowLeft className="size-4 mr-2" />
          Back to memories
        </Link>
      </Button>

      {!selectedType ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Create New Memory</h1>
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

          {hasMultipleHubs && (
            <div className="px-1 flex items-start gap-3 py-2">
              <Switch
                id="share-across-hubs"
                checked={shareAcrossHubs}
                onCheckedChange={setShareAcrossHubs}
                className="mt-0.5"
              />
              <div className="grid gap-1 leading-tight">
                <Label
                  htmlFor="share-across-hubs"
                  className="text-sm font-medium cursor-pointer"
                >
                  Share with all my families &amp; circles
                </Label>
                <p className="text-xs text-muted-foreground">
                  When on, this memory shows up in every hub you&apos;re a
                  member of. Turn it off to keep it scoped to this hub only.
                </p>
              </div>
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
            <GeneralForm onSubmit={handleSubmit} saving={saving} familyId={familyId ?? undefined} />
          )}
        </div>
      )}
    </div>
    </>
  );
}
