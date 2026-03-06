import { User, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/image-gallery";
import type { EntryStructuredData } from "@/types/database";

interface LessonViewProps {
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

export function LessonView({ entry }: LessonViewProps) {
  const sd = entry.structured_data;

  if (!sd || sd.type !== "lesson") {
    return <FallbackContent content={entry.content} />;
  }

  const lesson = sd.data;

  const hasAttribution = lesson.taught_by || lesson.when_learned;

  return (
    <div className="space-y-8">
      {/* Attribution */}
      {hasAttribution && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {lesson.taught_by && (
            <div className="flex items-center gap-2 text-sm">
              <User className="size-4 text-rose-500" />
              <span className="text-muted-foreground">
                Taught by{" "}
                <span className="font-medium text-foreground">
                  {lesson.taught_by}
                </span>
              </span>
            </div>
          )}
          {lesson.when_learned && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-rose-500" />
              <span className="text-muted-foreground">
                Learned{" "}
                <span className="font-medium text-foreground">
                  {lesson.when_learned}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Context */}
      {lesson.context && (
        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardContent>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Context
            </h4>
            <p className="leading-relaxed text-muted-foreground">
              {lesson.context}
            </p>
          </CardContent>
        </Card>
      )}

      {/* The Lesson */}
      {lesson.lesson_text && (
        <div className="rounded-lg border-l-4 border-l-rose-400 bg-rose-50/30 p-6 dark:border-l-rose-600 dark:bg-rose-950/10">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            The Lesson
          </h4>
          {lesson.lesson_text.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="mb-3 text-lg leading-relaxed text-foreground/90 last:mb-0"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Key Takeaways */}
      {lesson.key_takeaways.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-lg font-semibold text-rose-600 dark:text-rose-400">
              Key Takeaways
            </h3>
            <ol className="space-y-3">
              {lesson.key_takeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-rose-500" />
                  <p className="leading-relaxed text-foreground/90">
                    {takeaway}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {/* Photos */}
      {lesson.images && lesson.images.length > 0 && (
        <ImageGallery images={lesson.images} />
      )}
    </div>
  );
}
