import { Skeleton } from "@/components/ui/skeleton";

export default function GriotLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r p-4 space-y-3">
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />

        {/* Input skeleton */}
        <div className="w-full max-w-2xl mt-8">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
