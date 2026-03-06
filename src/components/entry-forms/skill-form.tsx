"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, X, Loader2, Wrench, Lightbulb } from "lucide-react";
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
import type { SkillData } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SkillStep {
  title: string;
  description: string;
  tips: string;
}

interface SkillFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: "skill";
    tags: string[];
    structured_data: { type: "skill"; data: SkillData };
  }) => Promise<void>;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DIFFICULTY_OPTIONS = [
  { value: "beginner" as const, label: "Beginner", color: "bg-green-500" },
  { value: "intermediate" as const, label: "Intermediate", color: "bg-yellow-500" },
  { value: "advanced" as const, label: "Advanced", color: "bg-red-500" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenSkillToContent(
  title: string,
  difficulty: string,
  prerequisites: string[],
  materials: string[],
  steps: SkillStep[],
  exercises: string,
  story: string
): string {
  const parts: string[] = [`Skill: ${title}`];

  parts.push(`Difficulty: ${difficulty}`);

  if (prerequisites.length > 0) {
    parts.push(`\nPrerequisites: ${prerequisites.join(", ")}`);
  }

  if (materials.length > 0) {
    parts.push(`\nWhat You'll Need: ${materials.join(", ")}`);
  }

  const stepLines = steps
    .filter((s) => s.title.trim() || s.description.trim())
    .map((s, i) => {
      let line = `${i + 1}. ${s.title.trim()}`;
      if (s.description.trim()) line += `\n   ${s.description.trim()}`;
      if (s.tips.trim()) line += `\n   Tip: ${s.tips.trim()}`;
      return line;
    });
  if (stepLines.length > 0) {
    parts.push(`\nSteps:\n${stepLines.join("\n\n")}`);
  }

  if (exercises.trim()) {
    parts.push(`\nPractice Exercises:\n${exercises.trim()}`);
  }

  if (story.trim()) {
    parts.push(`\nStory / Context:\n${story.trim()}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SkillForm({ onSubmit, saving = false }: SkillFormProps) {
  // State
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner"
  );
  const [prereqInput, setPrereqInput] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [steps, setSteps] = useState<SkillStep[]>([
    { title: "", description: "", tips: "" },
  ]);
  const [exercises, setExercises] = useState("");
  const [story, setStory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Tag-style list management (shared pattern for tags, prereqs, materials)
  // ---------------------------------------------------------------------------
  function makeTagHandlers(
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    const addFromInput = () => {
      const items = input
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && !list.includes(t));
      if (items.length > 0) setList((prev) => [...prev, ...items]);
      setInput("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addFromInput();
      }
    };

    const remove = (item: string) =>
      setList((prev) => prev.filter((t) => t !== item));

    return { addFromInput, onKeyDown, remove };
  }

  const tagHandlers = makeTagHandlers(tagInput, setTagInput, tags, setTags);
  const prereqHandlers = makeTagHandlers(
    prereqInput,
    setPrereqInput,
    prerequisites,
    setPrerequisites
  );
  const materialHandlers = makeTagHandlers(
    materialInput,
    setMaterialInput,
    materials,
    setMaterials
  );

  // ---------------------------------------------------------------------------
  // Step management
  // ---------------------------------------------------------------------------
  const updateStep = (idx: number, field: keyof SkillStep, value: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addStep = () =>
    setSteps((prev) => [...prev, { title: "", description: "", tips: "" }]);

  const removeStep = (idx: number) =>
    setSteps((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // ---------------------------------------------------------------------------
  // Validation + submit
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Skill title is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const structuredData: SkillData = {
      difficulty,
      prerequisites,
      what_you_need: materials,
      steps: steps
        .filter((s) => s.title.trim() || s.description.trim())
        .map((s, i) => ({
          order: i + 1,
          title: s.title.trim(),
          description: s.description.trim(),
          ...(s.tips.trim() ? { tips: s.tips.trim() } : {}),
        })),
      practice_exercises: exercises
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      story: story.trim(),
      images,
    };

    const content = flattenSkillToContent(
      title.trim(),
      difficulty,
      prerequisites,
      materials,
      steps,
      exercises,
      story
    );

    await onSubmit({
      title: title.trim(),
      content,
      type: "skill",
      tags,
      structured_data: { type: "skill", data: structuredData },
    });
  }

  // ---------------------------------------------------------------------------
  // Render helper: tag-input with badges
  // ---------------------------------------------------------------------------
  function renderTagInput(
    id: string,
    label: string,
    placeholder: string,
    inputValue: string,
    setInputValue: (v: string) => void,
    items: string[],
    handlers: ReturnType<typeof makeTagHandlers>
  ) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handlers.onKeyDown}
          onBlur={handlers.addFromInput}
        />
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {items.map((item) => (
              <Badge key={item} variant="secondary" className="gap-1 pr-1">
                {item}
                <button
                  type="button"
                  onClick={() => handlers.remove(item)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  aria-label={`Remove ${item}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 text-green-500">
            <Wrench className="size-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">New Skill</CardTitle>
            <CardDescription>
              Document a skill so others in your family can learn it too.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="skill-title">
            What skill are you documenting? <span className="text-destructive">*</span>
          </Label>
          <Input
            id="skill-title"
            placeholder="e.g., How to patch drywall, Canning peaches, Braiding hair"
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

        {/* Difficulty */}
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={difficulty === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(opt.value)}
                className={
                  difficulty === opt.value
                    ? `${opt.color} text-white hover:opacity-90`
                    : ""
                }
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Prerequisites */}
        {renderTagInput(
          "skill-prereqs",
          "Prerequisites",
          "What should someone know first? (comma-separated)",
          prereqInput,
          setPrereqInput,
          prerequisites,
          prereqHandlers
        )}

        {/* What You'll Need */}
        {renderTagInput(
          "skill-materials",
          "What You'll Need",
          "Tools, materials, supplies... (comma-separated)",
          materialInput,
          setMaterialInput,
          materials,
          materialHandlers
        )}

        {/* Steps */}
        <div className="space-y-3">
          <Label>Steps</Label>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-muted/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeStep(idx)}
                    disabled={steps.length <= 1}
                    aria-label="Remove step"
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <Input
                  placeholder="Step title (e.g., Prepare the surface)"
                  value={step.title}
                  onChange={(e) => updateStep(idx, "title", e.target.value)}
                />
                <Textarea
                  placeholder="Describe what to do in detail..."
                  value={step.description}
                  onChange={(e) => updateStep(idx, "description", e.target.value)}
                  rows={2}
                  className="resize-y"
                />
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-yellow-500 shrink-0" />
                  <Input
                    placeholder="Optional tip or pro trick for this step"
                    value={step.tips}
                    onChange={(e) => updateStep(idx, "tips", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="size-4 mr-1" />
            Add Step
          </Button>
        </div>

        {/* Practice Exercises */}
        <div className="space-y-2">
          <Label htmlFor="skill-exercises">Practice Exercises</Label>
          <Textarea
            id="skill-exercises"
            placeholder="Suggest exercises to practice this skill (one per line)"
            rows={3}
            value={exercises}
            onChange={(e) => setExercises(e.target.value)}
            className="resize-y"
          />
        </div>

        {/* Story / Context */}
        <div className="space-y-2">
          <Label htmlFor="skill-story">Story / Context</Label>
          <Textarea
            id="skill-story"
            placeholder="How did you learn this skill? Who taught you? What makes it important to your family?"
            rows={3}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="resize-y"
          />
        </div>

        {/* Tags */}
        {renderTagInput(
          "skill-tags",
          "Tags",
          "Add tags separated by commas, then press Enter",
          tagInput,
          setTagInput,
          tags,
          tagHandlers
        )}

        {/* Photos */}
        <ImageUpload
          images={images}
          onImagesChange={setImages}
          label="Skill Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Skill
        </Button>
      </CardFooter>
    </Card>
  );
}
