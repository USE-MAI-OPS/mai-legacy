"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { AudioRecorder } from "@/components/audio-recorder";
import { uploadEntryAudio } from "@/app/(dashboard)/entries/audio-actions";

interface EntryAudioRecorderProps {
  entryId: string;
}

export function EntryAudioRecorder({ entryId }: EntryAudioRecorderProps) {
  const [isPending, startTransition] = useTransition();
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRecordingComplete(blob: Blob, duration: number) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("audio", blob, "narration.webm");
      formData.append("duration", String(duration));

      const result = await uploadEntryAudio(entryId, formData);
      if (result.success) {
        setUploaded(true);
      } else {
        setError(result.error ?? "Upload failed");
      }
    });
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">
          Audio narration saved! Refresh to listen.
        </span>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Uploading audio...
        </span>
      </div>
    );
  }

  return (
    <div>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
