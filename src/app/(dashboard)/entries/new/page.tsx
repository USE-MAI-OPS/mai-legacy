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
import { createEntry } from "./actions";
import type { EntryType } from "@/types/database";

const entryTypes: { value: EntryType; label: string; emoji: string }[] = [
  { value: "story", label: "Story", emoji: "\uD83D\uDCD6" },
  { value: "skill", label: "Skill", emoji: "\uD83D\uDEE0\uFE0F" },
  { value: "recipe", label: "Recipe", emoji: "\uD83C\uDF73" },
  { value: "lesson", label: "Lesson", emoji: "\uD83C\uDF93" },
  { value: "connection", label: "Connection", emoji: "\uD83E\uDD1D" },
  { value: "general", label: "General", emoji: "\uD83D\uDCDD" },
];

export default function NewEntryPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<EntryType>("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>(
    {}
  );
  const [saving, setSaving] = useState(false);

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
    if (!content.trim()) newErrors.content = "Content is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    try {
      const result = await createEntry({
        title: title.trim(),
        content: content.trim(),
        type,
        tags,
      });

      if (result?.error) {
        // Supabase isn't connected yet, so we show a fallback.
        console.error("Failed to create entry:", result.error);
        // Still navigate back for demo purposes.
        router.push("/entries");
      } else if (result?.data?.id) {
        // Redirect to the newly created entry's detail page
        router.push(`/entries/${result.data.id}`);
      } else {
        router.push("/entries");
      }
    } catch {
      // For now just redirect since Supabase isn't connected.
      router.push("/entries");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/entries">
          <ArrowLeft className="size-4 mr-2" />
          Back to entries
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Entry</CardTitle>
          <CardDescription>
            Preserve a piece of your family&apos;s knowledge, story, or wisdom.
          </CardDescription>
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
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
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
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content)
                  setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              aria-invalid={!!errors.content}
              className="resize-y min-h-[160px]"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
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
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
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
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/entries">Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save Entry
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
