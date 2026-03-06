"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, X, Loader2, UtensilsCrossed } from "lucide-react";
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
import type { RecipeData } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Ingredient {
  amount: string;
  unit: string;
  item: string;
}

interface RecipeFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: "recipe";
    tags: string[];
    structured_data: { type: "recipe"; data: RecipeData };
  }) => Promise<void>;
  saving?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const UNITS = [
  "cups",
  "tsp",
  "tbsp",
  "oz",
  "lb",
  "pieces",
  "whole",
  "pinch",
  "dash",
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "easy" as const, label: "Easy", color: "bg-green-500" },
  { value: "medium" as const, label: "Medium", color: "bg-yellow-500" },
  { value: "hard" as const, label: "Hard", color: "bg-red-500" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenRecipeToContent(
  title: string,
  story: string,
  ingredients: Ingredient[],
  instructions: string[],
  prepTime: string,
  cookTime: string,
  servings: string,
  difficulty: string,
  cuisine: string
): string {
  const parts: string[] = [`Recipe: ${title}`];

  if (story.trim()) parts.push(`\n${story.trim()}`);

  const ingredientLines = ingredients
    .filter((i) => i.item.trim())
    .map((i) => {
      const amt = i.amount.trim();
      const unit = i.unit;
      const item = i.item.trim();
      return `- ${amt ? amt + " " : ""}${unit && unit !== "whole" ? unit + " " : ""}${item}`;
    });
  if (ingredientLines.length > 0) {
    parts.push(`\nIngredients:\n${ingredientLines.join("\n")}`);
  }

  const stepLines = instructions
    .filter((s) => s.trim())
    .map((s, i) => `${i + 1}. ${s.trim()}`);
  if (stepLines.length > 0) {
    parts.push(`\nInstructions:\n${stepLines.join("\n")}`);
  }

  const details: string[] = [];
  if (prepTime.trim()) details.push(`Prep Time: ${prepTime.trim()}`);
  if (cookTime.trim()) details.push(`Cook Time: ${cookTime.trim()}`);
  if (servings.trim()) details.push(`Servings: ${servings.trim()}`);
  if (difficulty) details.push(`Difficulty: ${difficulty}`);
  if (cuisine.trim()) details.push(`Cuisine: ${cuisine.trim()}`);
  if (details.length > 0) parts.push(`\n${details.join(" | ")}`);

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RecipeForm({ onSubmit, saving = false }: RecipeFormProps) {
  // State
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { amount: "", unit: "", item: "" },
  ]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [cuisine, setCuisine] = useState("");
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

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  // ---------------------------------------------------------------------------
  // Ingredient management
  // ---------------------------------------------------------------------------
  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { amount: "", unit: "", item: "" }]);

  const removeIngredient = (idx: number) =>
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // ---------------------------------------------------------------------------
  // Instruction management
  // ---------------------------------------------------------------------------
  const updateInstruction = (idx: number, value: string) => {
    setInstructions((prev) => prev.map((s, i) => (i === idx ? value : s)));
  };

  const addInstruction = () => setInstructions((prev) => [...prev, ""]);

  const removeInstruction = (idx: number) =>
    setInstructions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // ---------------------------------------------------------------------------
  // Validation + submit
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Recipe title is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const structuredData: RecipeData = {
      ingredients: ingredients
        .filter((i) => i.item.trim())
        .map((i) => ({
          item: i.item.trim(),
          amount: i.amount.trim(),
          unit: i.unit,
        })),
      instructions: instructions
        .filter((s) => s.trim())
        .map((s, i) => ({ step: i + 1, text: s.trim() })),
      prep_time: prepTime.trim(),
      cook_time: cookTime.trim(),
      servings: servings.trim(),
      difficulty,
      cuisine: cuisine.trim(),
      story: story.trim(),
      images,
    };

    const content = flattenRecipeToContent(
      title.trim(),
      story,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      cuisine
    );

    await onSubmit({
      title: title.trim(),
      content,
      type: "recipe",
      tags,
      structured_data: { type: "recipe", data: structuredData },
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-2 text-orange-500">
            <UtensilsCrossed className="size-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">New Recipe</CardTitle>
            <CardDescription>
              Preserve a cherished family recipe for generations to come.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="recipe-title">
            Recipe Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="recipe-title"
            placeholder="Grandma's Sunday Mac & Cheese"
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

        {/* Story behind the recipe */}
        <div className="space-y-2">
          <Label htmlFor="recipe-story">The Story Behind This Recipe</Label>
          <Textarea
            id="recipe-story"
            placeholder="Who taught you this? What memories does it bring? Where was it first cooked?"
            rows={3}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="resize-y"
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-3">
          <Label>Ingredients</Label>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Amt"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                  className="w-20"
                />
                <Select
                  value={ing.unit}
                  onValueChange={(v) => updateIngredient(idx, "unit", v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Ingredient (e.g., all-purpose flour)"
                  value={ing.item}
                  onChange={(e) => updateIngredient(idx, "item", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(idx)}
                  disabled={ingredients.length <= 1}
                  aria-label="Remove ingredient"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
            <Plus className="size-4 mr-1" />
            Add Ingredient
          </Button>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <Label>Instructions</Label>
          <div className="space-y-2">
            {instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-2.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <Textarea
                  placeholder={`Step ${idx + 1}: What to do...`}
                  value={step}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  rows={2}
                  className="flex-1 resize-y"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInstruction(idx)}
                  disabled={instructions.length <= 1}
                  aria-label="Remove step"
                  className="mt-1"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
            <Plus className="size-4 mr-1" />
            Add Step
          </Button>
        </div>

        {/* Prep / Cook / Servings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prep-time">Prep Time</Label>
            <Input
              id="prep-time"
              placeholder="20 min"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cook-time">Cook Time</Label>
            <Input
              id="cook-time"
              placeholder="45 min"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="servings">Servings</Label>
            <Input
              id="servings"
              placeholder="6"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
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

        {/* Cuisine */}
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine</Label>
          <Input
            id="cuisine"
            placeholder="Soul food, Italian, Caribbean..."
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="recipe-tags">Tags</Label>
          <Input
            id="recipe-tags"
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
          label="Recipe Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Recipe
        </Button>
      </CardFooter>
    </Card>
  );
}
