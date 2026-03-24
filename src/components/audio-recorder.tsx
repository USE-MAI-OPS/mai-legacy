"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  existingAudioUrl?: string | null;
  onRemove?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioRecorder({
  onRecordingComplete,
  existingAudioUrl,
  onRemove,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingAudioUrl ?? null
  );
  const [playing, setPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setDuration(dur);
        onRecordingComplete(blob, dur);

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const removeRecording = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setDuration(0);
    setPlaying(false);
    setPlaybackTime(0);
    onRemove?.();
  }, [previewUrl, onRemove]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        <Mic className="h-4 w-4" />
        Audio Narration
      </label>

      {!previewUrl && !recording && (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:border-primary/40"
        >
          <Mic className="h-5 w-5 mr-2" />
          Record audio narration
        </Button>
      )}

      {recording && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Recording...</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(recordingTime)}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        </div>
      )}

      {previewUrl && !recording && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
          <button
            type="button"
            onClick={togglePlayback}
            className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors shrink-0"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(playbackTime)} / {formatTime(duration)}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={removeRecording}
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <audio
            ref={audioRef}
            src={previewUrl}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setPlaybackTime(audioRef.current.currentTime);
              }
            }}
            onEnded={() => {
              setPlaying(false);
              setPlaybackTime(0);
            }}
            onLoadedMetadata={() => {
              if (audioRef.current && audioRef.current.duration !== Infinity) {
                setDuration(audioRef.current.duration);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
