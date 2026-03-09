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

const SUGGESTED_SKILL_TAGS = [
  "Cooking",
  "Gardening",
  "Home Repair",
  "Crafting",
  "Woodworking",
  "Sewing",
  "Auto Maintenance",
  "Technology",
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

  const toggleSuggestedTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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
    handlers: ReturnType<typeof makeTagHandlers>,
    suggestions?: string[],
    toggleSuggestion?: (v: string) => void
  ) {
    return (
      <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
        <Label htmlFor={id} className="text-lg">{label}</Label>

        {suggestions && toggleSuggestion && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((sug) => {
              const isActive = items.includes(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => toggleSuggestion(sug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                >
                  {sug}
                </button>
              );
            })}
          </div>
        )}

        <Input
          id={id}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handlers.onKeyDown}
          onBlur={handlers.addFromInput}
          className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
        />
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {items.map((item) => (
              <Badge key={item} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm bg-secondary/60">
                {item}
                <button
                  type="button"
                  onClick={() => handlers.remove(item)}
                  className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                  aria-label={`Remove ${item}`}
                >
                  <X className="size-3.5" />
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
    <Card className="rounded-2xl border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 p-4 text-green-600">
            <Wrench className="size-6" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl text-primary">New Skill</CardTitle>
            <CardDescription className="text-base">
              Document a skill so others in your family can learn it too.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Title */}
        <div className="space-y-3 bg-muted/30 p-6 rounded-2xl border border-border/50">
          <Label htmlFor="skill-title" className="text-lg">
            What skill are you documenting? <span className="text-destructive">*</span>
          </Label>
          <Input
            id="skill-title"
            placeholder="e.g., How to patch drywall, Canning peaches, Braiding hair"
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

        {/* Difficulty */}
        <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
          <Label className="text-lg">Difficulty Level</Label>
          <div className="flex flex-wrap gap-3">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={difficulty === opt.value ? "default" : "outline"}
                size="lg"
                onClick={() => setDifficulty(opt.value)}
                className={`rounded-xl px-6 ${difficulty === opt.value
                    ? `${opt.color} text-white border-transparent hover:opacity-90 shadow-sm`
                    : "bg-background border-border hover:bg-muted"
                  }`}
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
        <div className="space-y-4">
          <Label className="text-lg">Step-by-Step Instructions</Label>
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-accent-foreground/20 bg-muted/10 p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-primary/80">
                    Step {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(idx)}
                    disabled={steps.length <= 1}
                    className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    aria-label="Remove step"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Step title (e.g., Prepare the surface)"
                  value={step.title}
                  onChange={(e) => updateStep(idx, "title", e.target.value)}
                  className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
                />
                <Textarea
                  placeholder="Describe what to do in detail..."
                  value={step.description}
                  onChange={(e) => updateStep(idx, "description", e.target.value)}
                  rows={3}
                  className="resize-y text-base p-4 rounded-xl border-accent-foreground/20 bg-background leading-relaxed"
                />
                <div className="flex items-center gap-3 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                  <Lightbulb className="size-5 text-yellow-600 shrink-0" />
                  <Input
                    placeholder="Optional tip or pro trick for this step"
                    value={step.tips}
                    onChange={(e) => updateStep(idx, "tips", e.target.value)}
                    className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-yellow-700/50"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="lg" onClick={addStep} className="w-full rounded-xl border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:border-primary/50 bg-transparent">
            <Plus className="size-5 mr-2" />
            Add Another Step
          </Button>
        </div>

        {/* Practice Exercises */}
        <div className="space-y-3">
          <Label htmlFor="skill-exercises" className="text-lg">Practice Exercises</Label>
          <Textarea
            id="skill-exercises"
            placeholder="Suggest exercises to practice this skill (one per line)"
            rows={4}
            value={exercises}
            onChange={(e) => setExercises(e.target.value)}
            className="resize-y text-base p-5 rounded-2xl border-accent-foreground/20 leading-relaxed"
          />
        </div>

        {/* Story / Context */}
        <div className="space-y-3">
          <Label htmlFor="skill-story" className="text-lg">Story / Context</Label>
          <Textarea
            id="skill-story"
            placeholder="How did you learn this skill? Who taught you? What makes it important to your family?"
            rows={4}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="resize-y text-base p-5 rounded-2xl border-accent-foreground/20 leading-relaxed"
          />
        </div>

        {/* Tags */}
        {renderTagInput(
          "skill-tags",
          "Tags & Themes",
          "Type extra tags and press Enter",
          tagInput,
          setTagInput,
          tags,
          tagHandlers,
          SUGGESTED_SKILL_TAGS,
          toggleSuggestedTag
        )}

        {/* Photos */}
        <ImageUpload
          images={images}
          onImagesChange={setImages}
          label="Skill Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-4 p-6 bg-muted/10 rounded-b-2xl border-t border-border/50">
        <Button variant="ghost" size="lg" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button size="lg" className="rounded-xl px-8 shadow-md" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-5 mr-2 animate-spin" />}
          Save Skill
        </Button>
      </CardFooter>
    </Card>
  );
}
