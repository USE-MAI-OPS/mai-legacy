"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FamilyError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Could not load family</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          There was a problem loading your family space. Please try again.
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        <RefreshCw className="size-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
