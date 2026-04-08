"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { X, Loader2, FileText } from "lucide-react";
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
import { MatureToggle } from "@/components/entry-forms/mature-toggle";
import { CharacterCount } from "@/components/ui/character-count";
import { ImageUpload } from "@/components/image-upload";
import type { EntryType } from "@/types/database";

const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;

interface GeneralFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: EntryType;
    tags: string[];
    structured_data?: { type: "general"; data: { images?: string[] } };
    is_mature?: boolean;
  }) => Promise<void>;
  saving?: boolean;
  familyId?: string;
}

export default function GeneralForm({ onSubmit, saving = false, familyId }: GeneralFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isMature, setIsMature] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  // ---------------------------------------------------------------------------
  // Tag management
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    else if (title.length > TITLE_MAX) newErrors.title = `Title must be ${TITLE_MAX} characters or less.`;
    if (!content.trim()) newErrors.content = "Content is required.";
    else if (content.length > CONTENT_MAX) newErrors.content = `Content must be ${CONTENT_MAX} characters or less.`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit() {
    if (!validate()) return;

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      type: "general",
      tags,
      structured_data: images.length > 0 ? { type: "general", data: { images } } : undefined,
      is_mature: isMature,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2 text-gray-500">
            <FileText className="size-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">General Entry</CardTitle>
            <CardDescription>
              Preserve any piece of your family&apos;s knowledge, story, or
              wisdom.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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

        {/* Photos */}
        <ImageUpload
          images={images}
          onImagesChange={setImages}
          familyId={familyId}
          label="Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <MatureToggle checked={isMature} onCheckedChange={setIsMature} />
        <Button variant="outline" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Entry
        </Button>
      </CardFooter>
    </Card>
  );
}
