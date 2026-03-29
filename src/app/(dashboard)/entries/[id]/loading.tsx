import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EntryDetailLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back link */}
      <Skeleton className="h-4 w-24 mb-6" />

      {/* Entry header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-full" />
        ))}
      </div>

      {/* Cover image placeholder */}
      <Skeleton className="h-64 w-full rounded-xl mb-8" />

      {/* Recipe-style structured data skeleton */}
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta badges row */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>

          {/* Ingredients */}
          <div className="space-y-2 pt-2">
            <Skeleton className="h-5 w-28 mb-3" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-1.5 rounded-full shrink-0" />
                <Skeleton className="h-3 w-full max-w-xs" />
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-5 w-28 mb-3" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 pt-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main content body */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
