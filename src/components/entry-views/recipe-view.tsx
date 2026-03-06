import {
  Clock,
  Timer,
  Users,
  ChefHat,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/image-gallery";
import type { EntryStructuredData } from "@/types/database";

interface RecipeViewProps {
  entry: {
    title: string;
    content: string;
    structured_data?: EntryStructuredData | null;
  };
}

function FallbackContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      {content.split("\n\n").map((paragraph, i) => (
        <p key={i} className="text-muted-foreground leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
} as const;

export function RecipeView({ entry }: RecipeViewProps) {
  const sd = entry.structured_data;

  if (!sd || sd.type !== "recipe") {
    return <FallbackContent content={entry.content} />;
  }

  const recipe = sd.data;

  return (
    <div className="space-y-8">
      {/* Story / Origin */}
      {recipe.story && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-950/20">
          <CardContent>
            <p className="italic text-muted-foreground leading-relaxed">
              {recipe.story}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {recipe.prep_time && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
            <Clock className="size-3.5 text-orange-500" />
            Prep: {recipe.prep_time}
          </Badge>
        )}
        {recipe.cook_time && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
            <Timer className="size-3.5 text-orange-500" />
            Cook: {recipe.cook_time}
          </Badge>
        )}
        {recipe.servings && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
            <Users className="size-3.5 text-orange-500" />
            Serves {recipe.servings}
          </Badge>
        )}
        {recipe.difficulty && (
          <Badge
            className={`gap-1.5 border-transparent px-3 py-1.5 text-sm ${difficultyColors[recipe.difficulty]}`}
          >
            <ChefHat className="size-3.5" />
            {recipe.difficulty.charAt(0).toUpperCase() +
              recipe.difficulty.slice(1)}
          </Badge>
        )}
        {recipe.cuisine && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <UtensilsCrossed className="size-3.5" />
            {recipe.cuisine}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Ingredients + Instructions */}
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Ingredients */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-orange-600 dark:text-orange-400">
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-400" />
                <span>
                  {ing.amount && (
                    <span className="font-medium">{ing.amount}</span>
                  )}{" "}
                  {ing.unit && (
                    <span className="text-muted-foreground">{ing.unit}</span>
                  )}{" "}
                  {ing.item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-orange-600 dark:text-orange-400">
            Instructions
          </h3>
          <ol className="space-y-4">
            {recipe.instructions.map((inst) => (
              <li key={inst.step} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                  {inst.step}
                </span>
                <p className="pt-0.5 leading-relaxed text-foreground/90">
                  {inst.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Photos */}
      {recipe.images && recipe.images.length > 0 && (
        <>
          <Separator />
          <ImageGallery images={recipe.images} />
        </>
      )}
    </div>
  );
}
