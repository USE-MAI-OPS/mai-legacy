"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { X, Loader2, BookOpen } from "lucide-react";
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
import type { StoryData } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StoryFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: "story";
    tags: string[];
    structured_data: { type: "story"; data: StoryData };
  }) => Promise<void>;
  saving?: boolean;
  familyId?: string;
  mode?: "create" | "edit";
  cancelHref?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialImages?: string[];
  initialData?: Partial<StoryData>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SUGGESTED_STORY_TAGS = [
  "Childhood",
  "Holiday",
  "Vacation",
  "Funny",
  "Life Lesson",
  "Romantic",
  "School Days",
  "Hard Times",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenStoryToContent(
  title: string,
  when: string,
  where: string,
  people: string[],
  narrative: string
): string {
  const parts: string[] = [`Story: ${title}`];

  if (when.trim()) parts.push(`When: ${when.trim()}`);
  if (where.trim()) parts.push(`Where: ${where.trim()}`);
  if (people.length > 0) parts.push(`People involved: ${people.join(", ")}`);
  if (narrative.trim()) parts.push(`\n${narrative.trim()}`);

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function StoryForm({ onSubmit, saving = false, familyId, mode = "create", cancelHref = "/entries", initialTitle, initialTags, initialImages, initialData }: StoryFormProps) {
  // State
  const [title, setTitle] = useState(initialTitle ?? "");
  const [when, setWhen] = useState(initialData?.year ?? "");
  const [where, setWhere] = useState(initialData?.location ?? "");
  const [personInput, setPersonInput] = useState("");
  const [people, setPeople] = useState<string[]>(initialData?.people_involved ?? []);
  const [narrative, setNarrative] = useState(initialData?.narrative ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [images, setImages] = useState<string[]>(initialImages ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // People tag management
  // ---------------------------------------------------------------------------
  const addPeopleFromInput = useCallback(() => {
    const newPeople = personInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !people.includes(t));
    if (newPeople.length > 0) setPeople((prev) => [...prev, ...newPeople]);
    setPersonInput("");
  }, [personInput, people]);

  const handlePersonKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPeopleFromInput();
    }
  };

  const removePerson = (name: string) =>
    setPeople((prev) => prev.filter((p) => p !== name));

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

  const toggleSuggestedTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  // ---------------------------------------------------------------------------
  // Validation + submit
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!narrative.trim()) newErrors.narrative = "The story is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const structuredData: StoryData = {
      year: when.trim(),
      location: where.trim(),
      people_involved: people,
      narrative: narrative.trim(),
      images,
    };

    const content = flattenStoryToContent(
      title.trim(),
      when,
      where,
      people,
      narrative
    );

    await onSubmit({
      title: title.trim(),
      content,
      type: "story",
      tags,
      structured_data: { type: "story", data: structuredData },
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card className="rounded-2xl border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-blue-100 p-4 text-blue-500">
            <BookOpen className="size-6" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl text-primary">{mode === "edit" ? "Edit Story" : "New Story"}</CardTitle>
            <CardDescription className="text-base">
              {mode === "edit" ? "Update this story's details." : "Preserve a family memory before it fades away."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Title */}
        <div className="space-y-3 bg-muted/30 p-6 rounded-2xl border border-border/50">
          <Label htmlFor="story-title" className="text-lg">
            Story Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="story-title"
            placeholder="e.g. The Summer We Drove to Memphis"
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
          {/* When */}
          <div className="space-y-3">
            <Label htmlFor="story-when" className="text-lg">When did this happen?</Label>
            <Input
              id="story-when"
              placeholder="Summer of 1995, Christmas 2010..."
              className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>

          {/* Where */}
          <div className="space-y-3">
            <Label htmlFor="story-where" className="text-lg">Where did this happen?</Label>
            <Input
              id="story-where"
              placeholder="Grandma's kitchen, Lake Michigan..."
              className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
            />
          </div>
        </div>

        {/* Who was involved */}
        <div className="space-y-3">
          <Label htmlFor="story-people" className="text-lg">Who Was Involved</Label>
          <p className="text-sm text-muted-foreground mb-2">Type names and press Enter to tag family members</p>
          <Input
            id="story-people"
            placeholder="Aunt Sarah, Cousin Joey..."
            className="text-base py-5 rounded-xl border-accent-foreground/20"
            value={personInput}
            onChange={(e) => setPersonInput(e.target.value)}
            onKeyDown={handlePersonKeyDown}
            onBlur={addPeopleFromInput}
          />
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {people.map((person) => (
                <Badge key={person} className="gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                  {person}
                  <button
                    type="button"
                    onClick={() => removePerson(person)}
                    className="rounded-full p-0.5 hover:bg-blue-300 transition-colors"
                    aria-label={`Remove ${person}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* The Story */}
        <div className="space-y-3">
          <Label htmlFor="story-narrative" className="text-lg">
            The Story <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mb-2">Tell the story as if sharing it with your grandchildren around the dinner table...</p>
          <Textarea
            id="story-narrative"
            placeholder="It was a warm summer evening..."
            rows={12}
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              if (errors.narrative) setErrors((p) => ({ ...p, narrative: "" }));
            }}
            aria-invalid={!!errors.narrative}
            className="resize-y min-h-[250px] text-lg p-6 rounded-2xl border-accent-foreground/30 leading-relaxed"
          />
          {errors.narrative && (
            <p className="text-sm text-destructive font-medium">{errors.narrative}</p>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
          <Label htmlFor="story-tags" className="text-lg">Tags & Themes</Label>
          <p className="text-sm text-muted-foreground mb-4">Tap tags below, or type your own.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_STORY_TAGS.map((tag) => {
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
            id="story-tags"
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
          label="Story Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-4 p-6 bg-muted/10 rounded-b-2xl border-t border-border/50">
        <Button variant="ghost" size="lg" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button size="lg" className="rounded-xl px-8 shadow-md" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-5 mr-2 animate-spin" />}
          {mode === "edit" ? "Save Changes" : "Preserve Story"}
        </Button>
      </CardFooter>
    </Card>
  );
}
