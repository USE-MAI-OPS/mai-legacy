"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { VisibilitySelect } from "@/components/entry-forms/visibility-select";
import { CharacterCount } from "@/components/ui/character-count";
import { updateEntry } from "@/app/(dashboard)/entries/[id]/actions";
import type { EntryType, EntryVisibility, EntryStructuredData } from "@/types/database";

const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;

const entryTypes: { value: EntryType; label: string; emoji: string }[] = [
  { value: "story", label: "Story", emoji: "\uD83D\uDCD6" },
  { value: "skill", label: "Skill", emoji: "\uD83D\uDEE0\uFE0F" },
  { value: "recipe", label: "Recipe", emoji: "\uD83C\uDF73" },
  { value: "lesson", label: "Lesson", emoji: "\uD83C\uDF93" },
  { value: "connection", label: "Connection", emoji: "\uD83E\uDD1D" },
  { value: "general", label: "General", emoji: "\uD83D\uDCDD" },
];

// Types that support images in their structured_data
const IMAGE_TYPES: EntryType[] = ["skill", "recipe", "story", "lesson", "general"];

interface EditEntryFormProps {
  entry: {
    id: string;
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
    structured_data?: { type: string; data: Record<string, unknown> } | null;
    familyId?: string | null;
    visibility?: EntryVisibility;
  };
}

export default function EditEntryForm({ entry }: EditEntryFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [type, setType] = useState<EntryType>(entry.type);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>(
    {}
  );
  const [visibility, setVisibility] = useState<EntryVisibility>(entry.visibility ?? "family");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Images from structured_data
  const existingImages = (entry.structured_data?.data?.images as string[]) ?? [];
  const [images, setImages] = useState<string[]>(existingImages);

  // -------------------------------------------------------------------------
  // Tag management
  // -------------------------------------------------------------------------
  const addTagsFromInput = useCallback(() => {
    const newTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));

    if (newTags.length > 0) {
      setTags((prev) => [...prev, ...newTags]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagsFromInput();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    else if (title.length > TITLE_MAX) newErrors.title = `Title must be ${TITLE_MAX} characters or less.`;
    if (!content.trim()) newErrors.content = "Content is required.";
    else if (content.length > CONTENT_MAX) newErrors.content = `Content must be ${CONTENT_MAX} characters or less.`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    setServerError(null);
    try {
      // Build updated structured_data with images if applicable
      let structured_data = entry.structured_data ?? undefined;
      if (IMAGE_TYPES.includes(type)) {
        if (structured_data) {
          // Update images in existing structured_data
          structured_data = {
            ...structured_data,
            data: {
              ...structured_data.data,
              images,
            },
          };
        } else if (images.length > 0) {
          // Create minimal structured_data with images
          structured_data = {
            type,
            data: { images },
          };
        }
      }

      const result = await updateEntry(entry.id, {
        title: title.trim(),
        content: content.trim(),
        type,
        tags,
        structured_data: structured_data as EntryStructuredData | undefined,
        visibility,
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

  const supportsImages = IMAGE_TYPES.includes(type);

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href={`/entries/${entry.id}`}>
          <ArrowLeft className="size-4 mr-2" />
          Back to entry
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Memory</CardTitle>
          <CardDescription>
            Update this piece of your family&apos;s knowledge.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Give your entry a meaningful title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              onBlur={() => {
                if (!title.trim()) setErrors((prev) => ({ ...prev, title: "Title is required." }));
              }}
              aria-invalid={!!errors.title}
            />
            <div className="flex justify-between items-start gap-2">
              {errors.title ? (
                <p className="text-sm text-destructive">{errors.title}</p>
              ) : <span />}
              <CharacterCount current={title.length} max={TITLE_MAX} />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Tell the story, share the recipe, describe the skill..."
              rows={8}
              value={content}
              maxLength={CONTENT_MAX}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content)
                  setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              onBlur={() => {
                if (!content.trim()) setErrors((prev) => ({ ...prev, content: "Content is required." }));
              }}
              aria-invalid={!!errors.content}
              className="resize-y min-h-[160px]"
            />
            <div className="flex justify-between items-start gap-2">
              {errors.content ? (
                <p className="text-sm text-destructive">{errors.content}</p>
              ) : <span />}
              <CharacterCount current={content.length} max={CONTENT_MAX} />
            </div>
          </div>

          {/* Type selector */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as EntryType)}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {entryTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      {t.emoji} {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Add tags separated by commas, then press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTagsFromInput}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <VisibilitySelect value={visibility} onChange={setVisibility} />

          {/* Photos — only for types that support images */}
          {supportsImages && (
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              familyId={entry.familyId ?? undefined}
              label="Photos"
              maxImages={6}
            />
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/entries/${entry.id}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
