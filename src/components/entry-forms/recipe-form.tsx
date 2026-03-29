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
import { MatureToggle } from "@/components/entry-forms/mature-toggle";
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
    is_mature?: boolean;
  }) => Promise<void>;
  saving?: boolean;
  familyId?: string;
  mode?: "create" | "edit";
  cancelHref?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialImages?: string[];
  initialData?: Partial<RecipeData>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SUGGESTED_TAGS = [
  "Dinner",
  "Holiday",
  "Dessert",
  "Family Favorite",
  "Breakfast",
  "Baking",
  "Quick Meal",
  "Comfort Food",
];

const DIFFICULTY_OPTIONS = [
  { value: "easy" as const, label: "Easy", activeClass: "bg-green-500 text-white hover:opacity-90" },
  { value: "medium" as const, label: "Medium", activeClass: "bg-yellow-500 text-white hover:opacity-90" },
  { value: "hard" as const, label: "Hard", activeClass: "bg-red-500 text-white hover:opacity-90" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenRecipeToContent(
  title: string,
  story: string,
  ingredients: string[],
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
    .filter((i) => i.trim())
    .map((i) => `- ${i.trim()}`);
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
export default function RecipeForm({ onSubmit, saving = false, familyId, mode = "create", cancelHref = "/entries", initialTitle, initialTags, initialImages, initialData }: RecipeFormProps) {
  // State
  const [title, setTitle] = useState(initialTitle ?? "");
  const [story, setStory] = useState(initialData?.story ?? "");
  const [ingredients, setIngredients] = useState<string[]>(
    initialData?.ingredients?.map(i => `${i.amount} ${i.unit} ${i.item}`.trim()) ?? [""]
  );
  const [instructions, setInstructions] = useState<string[]>(
    initialData?.instructions?.map(i => i.text) ?? [""]
  );
  const [prepTime, setPrepTime] = useState(initialData?.prep_time ?? "");
  const [cookTime, setCookTime] = useState(initialData?.cook_time ?? "");
  const [servings, setServings] = useState(initialData?.servings ?? "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initialData?.difficulty ?? "easy");
  const [cuisine, setCuisine] = useState(initialData?.cuisine ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [images, setImages] = useState<string[]>(initialImages ?? []);
  const [isMature, setIsMature] = useState(false);
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

  const toggleSuggestedTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  // ---------------------------------------------------------------------------
  // Ingredient management
  // ---------------------------------------------------------------------------
  const updateIngredient = (idx: number, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? value : ing)));
  };

  const addIngredient = () => setIngredients((prev) => [...prev, ""]);

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
        .filter((i) => i.trim())
        .map((i) => ({
          item: i.trim(),
          amount: "",
          unit: "",
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
      is_mature: isMature,
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card className="rounded-2xl border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <UtensilsCrossed className="size-6" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl text-primary">{mode === "edit" ? "Edit Recipe" : "New Recipe"}</CardTitle>
            <CardDescription className="text-base">
              {mode === "edit" ? "Update this recipe's details." : "Preserve a cherished family recipe for generations to come."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <Label htmlFor="recipe-title" className="text-lg">
            Recipe Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="recipe-title"
            placeholder="e.g. Grandma's Sunday Mac & Cheese"
            className="text-lg py-6 rounded-xl border-accent-foreground/20"
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

        {/* Story behind the recipe */}
        <div className="space-y-3">
          <Label htmlFor="recipe-story" className="text-lg">The Story Behind This Recipe</Label>
          <Textarea
            id="recipe-story"
            placeholder="Who taught you this? What memories does it bring? Where was it first cooked?"
            rows={4}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="resize-y text-base p-4 rounded-xl border-accent-foreground/20"
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-4 bg-muted/30 p-6 rounded-2xl border border-border/50">
          <Label className="text-lg">Ingredients</Label>
          <p className="text-sm text-muted-foreground mb-2">Just type the amount and ingredient on one line (e.g. "2 cups of flour")</p>
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                <Input
                  placeholder="e.g. 2 cups of sifted flour"
                  value={ing}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                  className="flex-1 text-base py-5 rounded-xl border-accent-foreground/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(idx)}
                  disabled={ingredients.length <= 1}
                  aria-label="Remove ingredient"
                  className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="lg" className="mt-2 rounded-xl border-primary text-primary hover:bg-primary/5" onClick={addIngredient}>
            <Plus className="size-5 mr-2" />
            Add Another Ingredient
          </Button>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <Label className="text-lg">Instructions</Label>
          <div className="space-y-4">
            {instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {idx + 1}
                </span>
                <Textarea
                  placeholder={`Step ${idx + 1}: What to do next...`}
                  value={step}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  rows={2}
                  className="flex-1 resize-y text-base p-4 rounded-xl border-accent-foreground/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInstruction(idx)}
                  disabled={instructions.length <= 1}
                  aria-label="Remove step"
                  className="mt-1 hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={addInstruction}>
            <Plus className="size-5 mr-2" />
            Add Next Step
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
                className={difficulty === opt.value ? opt.activeClass : ""}
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
        <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
          <Label htmlFor="recipe-tags" className="text-lg">Tags & Categories</Label>
          <p className="text-sm text-muted-foreground mb-2">Tap any suggested tags, or type your own to categorize this recipe.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_TAGS.map((tag) => {
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
            id="recipe-tags"
            placeholder="Type other tags (e.g. Grandma's favorites) and press Enter"
            className="text-base py-5 rounded-xl border-accent-foreground/20"
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
          label="Recipe Photos"
          maxImages={6}
        />
      </CardContent>

      <CardFooter className="flex justify-end gap-4 p-6 bg-muted/10 rounded-b-2xl border-t border-border/50">
        <MatureToggle checked={isMature} onCheckedChange={setIsMature} />
        <Button variant="ghost" size="lg" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button size="lg" className="rounded-xl px-8 shadow-md" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-5 mr-2 animate-spin" />}
          {mode === "edit" ? "Save Changes" : "Preserve Recipe"}
        </Button>
      </CardFooter>
    </Card>
  );
}
