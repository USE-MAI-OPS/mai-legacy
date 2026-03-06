import { Lightbulb, Square, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/image-gallery";
import type { EntryStructuredData } from "@/types/database";

interface SkillViewProps {
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

const difficultyConfig = {
  beginner: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Beginner",
  },
  intermediate: {
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Intermediate",
  },
  advanced: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Advanced",
  },
} as const;

export function SkillView({ entry }: SkillViewProps) {
  const sd = entry.structured_data;

  if (!sd || sd.type !== "skill") {
    return <FallbackContent content={entry.content} />;
  }

  const skill = sd.data;
  const difficulty = difficultyConfig[skill.difficulty];

  return (
    <div className="space-y-8">
      {/* Difficulty + Prerequisites */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          className={`border-transparent px-3 py-1.5 text-sm ${difficulty.color}`}
        >
          {difficulty.label}
        </Badge>
        {skill.prerequisites.map((prereq) => (
          <Badge key={prereq} variant="outline" className="px-3 py-1.5 text-sm">
            {prereq}
          </Badge>
        ))}
      </div>

      {/* What You'll Need */}
      {skill.what_you_need.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-lg font-semibold text-teal-600 dark:text-teal-400">
              What You&apos;ll Need
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {skill.what_you_need.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <Square className="size-4 shrink-0 text-teal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Steps */}
      {skill.steps.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-6 text-lg font-semibold text-teal-600 dark:text-teal-400">
              Steps
            </h3>
            <div className="space-y-4">
              {skill.steps.map((step) => (
                <Card key={step.order} className="border-l-4 border-l-teal-400 dark:border-l-teal-600">
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                        {step.order}
                      </span>
                      <div className="space-y-2 pt-0.5">
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="leading-relaxed text-foreground/80">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {step.tips && (
                      <div className="ml-10 flex gap-2.5 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                        <Lightbulb className="mt-0.5 size-4 shrink-0 text-blue-500" />
                        <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
                          {step.tips}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Practice Exercises */}
      {skill.practice_exercises.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-teal-600 dark:text-teal-400">
              <Dumbbell className="size-5" />
              Practice Exercises
            </h3>
            <ul className="space-y-3">
              {skill.practice_exercises.map((exercise, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed">{exercise}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Story / Context */}
      {skill.story && (
        <>
          <Separator />
          <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900/40 dark:bg-teal-950/20">
            <CardContent>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                The Story Behind This Skill
              </h4>
              <p className="italic leading-relaxed text-muted-foreground">
                {skill.story}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Photos */}
      {skill.images && skill.images.length > 0 && (
        <>
          <Separator />
          <ImageGallery images={skill.images} />
        </>
      )}
    </div>
  );
}
