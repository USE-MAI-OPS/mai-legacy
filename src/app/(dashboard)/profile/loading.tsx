import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
        <Skeleton className="size-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories contributed */}
      <div className="mb-12">
        <Skeleton className="h-3 w-36 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* My Story section */}
      <div className="mb-16">
        <Skeleton className="h-6 w-32 mb-4" />
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="mt-8">
        <Skeleton className="h-7 w-48 mb-8" />
        <div className="relative border-l border-stone-200 dark:border-stone-800 ml-3 md:ml-4 space-y-10 pb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative pl-8 md:pl-10">
              <div className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-stone-200 dark:bg-stone-700" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="size-10 rounded-full shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
