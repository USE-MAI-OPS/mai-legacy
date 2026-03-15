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
  familyId?: string;
  mode?: "create" | "edit";
  cancelHref?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialImages?: string[];
  initialData?: Partial<LessonData>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SUGGESTED_LESSON_TAGS = [
  "Life Advice",
  "Career",
  "Finances",
  "Relationships",
  "Parenting",
  "Health",
  "Faith",
  "Hard Truth",
];

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
export default function LessonForm({ onSubmit, saving = false, familyId, mode = "create", cancelHref = "/entries", initialTitle, initialTags, initialImages, initialData }: LessonFormProps) {
  // State
  const [title, setTitle] = useState(initialTitle ?? "");
  const [taughtBy, setTaughtBy] = useState(initialData?.taught_by ?? "");
  const [whenLearned, setWhenLearned] = useState(initialData?.when_learned ?? "");
  const [context, setContext] = useState(initialData?.context ?? "");
  const [lessonText, setLessonText] = useState(initialData?.lesson_text ?? "");
  const [takeaways, setTakeaways] = useState<string[]>(initialData?.key_takeaways ?? [""]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [images, setImages] = useState<string[]>(initialImages ?? []);
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

  const toggleSuggestedTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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
    <Card className="rounded-2xl border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-purple-100 p-4 text-purple-600">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl text-primary">{mode === "edit" ? "Edit Lesson" : "New Lesson"}</CardTitle>
            <CardDescription className="text-base">
              {mode === "edit" ? "Update this lesson's details." : "Capture hard-earned wisdom so your family never has to learn it the hard way again."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Title */}
        <div className="space-y-3 bg-muted/30 p-6 rounded-2xl border border-border/50">
          <Label htmlFor="lesson-title" className="text-lg">
            What&apos;s the lesson? <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lesson-title"
            placeholder="e.g., Always save before you spend, Measure twice cut once"
            className="text-lg py-6 rounded-xl border-accent-foreground/20 bg-background"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: "" }));
            }}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive font-medium">{errors.title}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-2xl border border-border/40">
          {/* Who taught you */}
          <div className="space-y-3">
            <Label htmlFor="lesson-taught-by" className="text-lg">Who Taught You This?</Label>
            <Input
              id="lesson-taught-by"
              placeholder="Grandpa, Mom, Coach Williams, life itself..."
              className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
              value={taughtBy}
              onChange={(e) => setTaughtBy(e.target.value)}
            />
          </div>

          {/* When */}
          <div className="space-y-3">
            <Label htmlFor="lesson-when" className="text-lg">When Did You Learn This?</Label>
            <Input
              id="lesson-when"
              placeholder="During college, after the move to Chicago, 2003..."
              className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
              value={whenLearned}
              onChange={(e) => setWhenLearned(e.target.value)}
            />
          </div>
        </div>

        {/* Context */}
        <div className="space-y-3">
          <Label htmlFor="lesson-context" className="text-lg">Context</Label>
          <Textarea
            id="lesson-context"
            placeholder="What was happening at the time? What led up to this lesson?"
            rows={4}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="resize-y text-base p-5 rounded-2xl border-accent-foreground/20 leading-relaxed"
          />
        </div>

        {/* The Lesson */}
        <div className="space-y-3">
          <Label htmlFor="lesson-text" className="text-lg">
            The Lesson <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="lesson-text"
            placeholder="Explain the lesson in your own words. What did you learn? Why does it matter?"
            rows={8}
            value={lessonText}
            onChange={(e) => {
              setLessonText(e.target.value);
              if (errors.lessonText) setErrors((p) => ({ ...p, lessonText: "" }));
            }}
            aria-invalid={!!errors.lessonText}
            className="resize-y min-h-[160px] text-lg p-6 rounded-2xl border-accent-foreground/30 leading-relaxed"
          />
          {errors.lessonText && (
            <p className="text-sm text-destructive font-medium">{errors.lessonText}</p>
          )}
        </div>

        {/* Key Takeaways */}
        <div className="space-y-4">
          <Label className="text-lg">Key Takeaways</Label>
          <div className="space-y-3">
            {takeaways.map((takeaway, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-sm">
                  {idx + 1}
                </span>
                <Input
                  placeholder="One key thing to remember..."
                  value={takeaway}
                  onChange={(e) => updateTakeaway(idx, e.target.value)}
                  className="flex-1 text-base py-5 rounded-xl border-accent-foreground/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTakeaway(idx)}
                  disabled={takeaways.length <= 1}
                  className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                  aria-label="Remove takeaway"
                >
                  <Trash2 className="size-5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="lg" onClick={addTakeaway} className="w-full rounded-xl border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:border-primary/50 bg-transparent">
            <Plus className="size-5 mr-2" />
            Add Takeaway
          </Button>
        </div>

        {/* Tags */}
        <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
          <Label htmlFor="lesson-tags" className="text-lg">Tags & Themes</Label>
          <p className="text-sm text-muted-foreground mb-4">Tap tags below, or type your own.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_LESSON_TAGS.map((tag) => {
              const isActive = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSuggestedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <Input
            id="lesson-tags"
            placeholder="Type extra tags and press Enter"
            className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTagsFromInput}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm bg-secondary/60">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="size-3.5" />
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

      <CardFooter className="flex justify-end gap-4 p-6 bg-muted/10 rounded-b-2xl border-t border-border/50">
        <Button variant="ghost" size="lg" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button size="lg" className="rounded-xl px-8 shadow-md" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-5 mr-2 animate-spin" />}
          {mode === "edit" ? "Save Changes" : "Save Lesson"}
        </Button>
      </CardFooter>
    </Card>
  );
}
