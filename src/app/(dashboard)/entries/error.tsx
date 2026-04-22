"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EntriesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Could not load memories</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          There was a problem loading your family memories. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RefreshCw className="size-4 mr-2" />
          Try again
        </Button>
        <Button asChild variant="ghost">
          <Link href="/feed">
            <BookOpen className="size-4 mr-2" />
            Feed
          </Link>
        </Button>
      </div>
    </div>
  );
}
