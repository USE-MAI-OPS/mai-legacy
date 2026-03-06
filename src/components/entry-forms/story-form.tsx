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
}

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
export default function StoryForm({ onSubmit, saving = false }: StoryFormProps) {
  // State
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [personInput, setPersonInput] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [narrative, setNarrative] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2 text-blue-500">
            <BookOpen className="size-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">New Story</CardTitle>
            <CardDescription>
              Preserve a family memory before it fades away.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="story-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="story-title"
            placeholder="Give this memory a name, e.g., The Summer We Drove to Memphis"
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

        {/* When */}
        <div className="space-y-2">
          <Label htmlFor="story-when">When</Label>
          <Input
            id="story-when"
            placeholder="Summer of 1995, Christmas 2010, a rainy Tuesday..."
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </div>

        {/* Where */}
        <div className="space-y-2">
          <Label htmlFor="story-where">Where</Label>
          <Input
            id="story-where"
            placeholder="Grandma's kitchen, Lake Michigan, the old house on Elm St."
            value={where}
            onChange={(e) => setWhere(e.target.value)}
          />
        </div>

        {/* Who was involved */}
        <div className="space-y-2">
          <Label htmlFor="story-people">Who Was Involved</Label>
          <Input
            id="story-people"
            placeholder="Add names separated by commas, then press Enter"
            value={personInput}
            onChange={(e) => setPersonInput(e.target.value)}
            onKeyDown={handlePersonKeyDown}
            onBlur={addPeopleFromInput}
          />
          {people.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {people.map((person) => (
                <Badge key={person} variant="secondary" className="gap-1 pr-1">
                  {person}
                  <button
                    type="button"
                    onClick={() => removePerson(person)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    aria-label={`Remove ${person}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* The Story */}
        <div className="space-y-2">
          <Label htmlFor="story-narrative">
            The Story <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="story-narrative"
            placeholder="Tell the story as if sharing it with your grandchildren around the dinner table..."
            rows={10}
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              if (errors.narrative) setErrors((p) => ({ ...p, narrative: "" }));
            }}
            aria-invalid={!!errors.narrative}
            className="resize-y min-h-[200px]"
          />
          {errors.narrative && (
            <p className="text-sm text-destructive">{errors.narrative}</p>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="story-tags">Tags</Label>
          <Input
            id="story-tags"
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
          label="Story Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Story
        </Button>
      </CardFooter>
    </Card>
  );
}
