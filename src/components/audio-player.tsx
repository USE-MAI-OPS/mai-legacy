"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  duration?: number;
  authorName?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  duration: initialDuration,
  authorName,
  className,
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10",
        className
      )}
    >
      {/* Play button */}
      <button
        onClick={togglePlay}
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all",
          playing
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>

      {/* Waveform / progress */}
      <div className="flex-1 min-w-0">
        {authorName && (
          <div className="flex items-center gap-1.5 mb-1">
            <Volume2 className="h-3 w-3 text-primary/60" />
            <span className="text-xs font-medium text-primary/80">
              Narrated by {authorName}
            </span>
          </div>
        )}
        <div
          className="h-2 bg-primary/10 rounded-full cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
          }
        }}
      />
    </div>
  );
}
