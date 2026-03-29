import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-36 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Feed cards */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Cover image skeleton for every other card */}
            {i % 2 === 0 && <Skeleton className="h-48 w-full rounded-none" />}
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
