"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, X, Loader2, GraduationCap } from "lucide-react";
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
import { ImageUpload } from "@/components/image-upload";
import type { LessonData } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LessonFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: "lesson";
    tags: string[];
    structured_data: { type: "lesson"; data: LessonData };
  }) => Promise<void>;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenLessonToContent(
  title: string,
  taughtBy: string,
  whenLearned: string,
  context: string,
  lessonText: string,
  takeaways: string[]
): string {
  const parts: string[] = [`Lesson: ${title}`];

  if (taughtBy.trim()) parts.push(`Taught by: ${taughtBy.trim()}`);
  if (whenLearned.trim()) parts.push(`When: ${whenLearned.trim()}`);

  if (context.trim()) parts.push(`\nContext:\n${context.trim()}`);

  if (lessonText.trim()) parts.push(`\nThe Lesson:\n${lessonText.trim()}`);

  const validTakeaways = takeaways.filter((t) => t.trim());
  if (validTakeaways.length > 0) {
    const lines = validTakeaways.map((t) => `- ${t.trim()}`).join("\n");
    parts.push(`\nKey Takeaways:\n${lines}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LessonForm({ onSubmit, saving = false }: LessonFormProps) {
  // State
  const [title, setTitle] = useState("");
  const [taughtBy, setTaughtBy] = useState("");
  const [whenLearned, setWhenLearned] = useState("");
  const [context, setContext] = useState("");
  const [lessonText, setLessonText] = useState("");
  const [takeaways, setTakeaways] = useState<string[]>([""]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Tag management
  // ---------------------------------------------------------------------------
  const addTagsFromInput = useCallback(() => {
    const newTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (newTags.length > 0) setTags((prev) => [...prev, ...newTags]);
    setTagInput("");
  }, [tagInput, tags]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagsFromInput();
    }
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  // ---------------------------------------------------------------------------
  // Takeaway management
  // ---------------------------------------------------------------------------
  const updateTakeaway = (idx: number, value: string) => {
    setTakeaways((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };

  const addTakeaway = () => setTakeaways((prev) => [...prev, ""]);

  const removeTakeaway = (idx: number) =>
    setTakeaways((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );

  // ---------------------------------------------------------------------------
  // Validation + submit
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!lessonText.trim()) newErrors.lessonText = "The lesson is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const structuredData: LessonData = {
      context: context.trim(),
      lesson_text: lessonText.trim(),
      taught_by: taughtBy.trim(),
      key_takeaways: takeaways.filter((t) => t.trim()).map((t) => t.trim()),
      when_learned: whenLearned.trim(),
      images,
    };

    const content = flattenLessonToContent(
      title.trim(),
      taughtBy,
      whenLearned,
      context,
      lessonText,
      takeaways
    );

    await onSubmit({
      title: title.trim(),
      content,
      type: "lesson",
      tags,
      structured_data: { type: "lesson", data: structuredData },
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2 text-purple-500">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">New Lesson</CardTitle>
            <CardDescription>
              Capture hard-earned wisdom so your family never has to learn it the
              hard way again.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="lesson-title">
            What&apos;s the lesson? <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lesson-title"
            placeholder="e.g., Always save before you spend, Measure twice cut once"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: "" }));
            }}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        {/* Who taught you */}
        <div className="space-y-2">
          <Label htmlFor="lesson-taught-by">Who Taught You This?</Label>
          <Input
            id="lesson-taught-by"
            placeholder="Grandpa, Mom, Coach Williams, life itself..."
            value={taughtBy}
            onChange={(e) => setTaughtBy(e.target.value)}
          />
        </div>

        {/* When */}
        <div className="space-y-2">
          <Label htmlFor="lesson-when">When Did You Learn This?</Label>
          <Input
            id="lesson-when"
            placeholder="During college, after the move to Chicago, 2003..."
            value={whenLearned}
            onChange={(e) => setWhenLearned(e.target.value)}
          />
        </div>

        {/* Context */}
        <div className="space-y-2">
          <Label htmlFor="lesson-context">Context</Label>
          <Textarea
            id="lesson-context"
            placeholder="What was happening at the time? What led up to this lesson?"
            rows={3}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="resize-y"
          />
        </div>

        {/* The Lesson */}
        <div className="space-y-2">
          <Label htmlFor="lesson-text">
            The Lesson <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="lesson-text"
            placeholder="Explain the lesson in your own words. What did you learn? Why does it matter?"
            rows={6}
            value={lessonText}
            onChange={(e) => {
              setLessonText(e.target.value);
              if (errors.lessonText) setErrors((p) => ({ ...p, lessonText: "" }));
            }}
            aria-invalid={!!errors.lessonText}
            className="resize-y min-h-[120px]"
          />
          {errors.lessonText && (
            <p className="text-sm text-destructive">{errors.lessonText}</p>
          )}
        </div>

        {/* Key Takeaways */}
        <div className="space-y-3">
          <Label>Key Takeaways</Label>
          <div className="space-y-2">
            {takeaways.map((takeaway, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <Input
                  placeholder="One key thing to remember..."
                  value={takeaway}
                  onChange={(e) => updateTakeaway(idx, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTakeaway(idx)}
                  disabled={takeaways.length <= 1}
                  aria-label="Remove takeaway"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTakeaway}>
            <Plus className="size-4 mr-1" />
            Add Takeaway
          </Button>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="lesson-tags">Tags</Label>
          <Input
            id="lesson-tags"
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
          label="Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Lesson
        </Button>
      </CardFooter>
    </Card>
  );
}
