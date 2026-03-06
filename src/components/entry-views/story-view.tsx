import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/image-gallery";
import type { EntryStructuredData } from "@/types/database";

interface StoryViewProps {
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

export function StoryView({ entry }: StoryViewProps) {
  const sd = entry.structured_data;

  if (!sd || sd.type !== "story") {
    return <FallbackContent content={entry.content} />;
  }

  const story = sd.data;

  const hasMetadata =
    story.year || story.location || story.people_involved.length > 0;

  return (
    <div className="space-y-8">
      {/* Metadata Bar */}
      {hasMetadata && (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {story.year && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4 text-indigo-500" />
                <span>{story.year}</span>
              </div>
            )}
            {story.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 text-indigo-500" />
                <span>{story.location}</span>
              </div>
            )}
            {story.people_involved.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {story.people_involved.map((person) => (
                  <Badge
                    key={person}
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {person}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Narrative */}
      <div className="max-w-none">
        {story.narrative.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            className="mb-6 text-lg leading-relaxed text-foreground/90 last:mb-0"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Photos */}
      {story.images && story.images.length > 0 && (
        <ImageGallery images={story.images} />
      )}
    </div>
  );
}
