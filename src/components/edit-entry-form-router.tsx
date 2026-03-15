"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateEntry } from "@/app/(dashboard)/entries/[id]/actions";
import type { EntryType } from "@/types/database";

import RecipeForm from "@/components/entry-forms/recipe-form";
import SkillForm from "@/components/entry-forms/skill-form";
import StoryForm from "@/components/entry-forms/story-form";
import LessonForm from "@/components/entry-forms/lesson-form";
import ConnectionForm from "@/components/entry-forms/connection-form";
import EditEntryForm from "@/components/edit-entry-form";

interface EditEntryFormRouterProps {
  entry: {
    id: string;
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
    structured_data?: { type: string; data: Record<string, unknown> } | null;
    familyId?: string | null;
  };
}

export default function EditEntryFormRouter({ entry }: EditEntryFormRouterProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const cancelHref = `/entries/${entry.id}`;
  const sd = entry.structured_data?.data as Record<string, unknown> | undefined;

  async function handleSubmit(data: {
    title: string;
    content: string;
    type: string;
    tags: string[];
    structured_data: { type: string; data: Record<string, unknown> };
  }) {
    setSaving(true);
    setServerError(null);
    try {
      const result = await updateEntry(entry.id, {
        title: data.title,
        content: data.content,
        type: data.type as EntryType,
        tags: data.tags,
        structured_data: data.structured_data,
      });
      if (result?.error) {
        setServerError(result.error);
      } else {
        router.push(`/entries/${entry.id}`);
      }
    } catch {
      setServerError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  // Wrap content with back link and error display
  function renderForm(formElement: React.ReactNode) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href={cancelHref}>
            <ArrowLeft className="size-4 mr-2" />
            Back to entry
          </Link>
        </Button>

        {serverError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-6">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        {formElement}
      </div>
    );
  }

  // Route to the correct type-specific form
  switch (entry.type) {
    case "recipe":
      return renderForm(
        <RecipeForm
          onSubmit={handleSubmit as any}
          saving={saving}
          familyId={entry.familyId ?? undefined}
          mode="edit"
          cancelHref={cancelHref}
          initialTitle={entry.title}
          initialTags={entry.tags}
          initialImages={(sd?.images as string[]) ?? []}
          initialData={sd as any}
        />
      );

    case "skill":
      return renderForm(
        <SkillForm
          onSubmit={handleSubmit as any}
          saving={saving}
          familyId={entry.familyId ?? undefined}
          mode="edit"
          cancelHref={cancelHref}
          initialTitle={entry.title}
          initialTags={entry.tags}
          initialImages={(sd?.images as string[]) ?? []}
          initialData={sd as any}
        />
      );

    case "story":
      return renderForm(
        <StoryForm
          onSubmit={handleSubmit as any}
          saving={saving}
          familyId={entry.familyId ?? undefined}
          mode="edit"
          cancelHref={cancelHref}
          initialTitle={entry.title}
          initialTags={entry.tags}
          initialImages={(sd?.images as string[]) ?? []}
          initialData={sd as any}
        />
      );

    case "lesson":
      return renderForm(
        <LessonForm
          onSubmit={handleSubmit as any}
          saving={saving}
          familyId={entry.familyId ?? undefined}
          mode="edit"
          cancelHref={cancelHref}
          initialTitle={entry.title}
          initialTags={entry.tags}
          initialImages={(sd?.images as string[]) ?? []}
          initialData={sd as any}
        />
      );

    case "connection":
      return renderForm(
        <ConnectionForm
          onSubmit={handleSubmit as any}
          saving={saving}
          mode="edit"
          cancelHref={cancelHref}
          initialTitle={entry.title}
          initialTags={entry.tags}
          initialData={sd as any}
        />
      );

    default:
      // Fall back to generic edit form for unknown types
      return <EditEntryForm entry={entry} />;
  }
}
