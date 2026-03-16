"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadFamilyCover, getFamilyCoverUrl } from "@/lib/supabase/storage";

interface FamilyCoverPhotoProps {
  familyId: string;
  initialCoverUrl?: string | null;
}

export function FamilyCoverPhoto({
  familyId,
  initialCoverUrl,
}: FamilyCoverPhotoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initialCoverUrl ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hovered, setHovered] = useState(false);

  // On mount, check for existing cover if none provided
  useEffect(() => {
    if (!initialCoverUrl) {
      getFamilyCoverUrl(familyId).then((url) => {
        if (url) setCoverUrl(url);
      });
    }
  }, [familyId, initialCoverUrl]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploading(true);

      const url = await uploadFamilyCover(file, familyId);
      if (url) {
        // Append timestamp to bust cache
        setCoverUrl(`${url}?t=${Date.now()}`);
      }
      setUploading(false);
    },
    [familyId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // If there's a cover photo, show it with a change overlay on hover
  if (coverUrl) {
    return (
      <div
        className="relative h-64 md:h-[400px] group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt="Family Portrait"
          className="w-full h-full object-cover"
        />

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 transition-opacity duration-200",
            hovered || dragOver ? "opacity-100" : "opacity-0"
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <>
              <Camera className="h-8 w-8 text-white" />
              <span className="text-white text-sm font-medium">
                Change Family Photo
              </span>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  // Empty state — show upload prompt
  return (
    <div
      className={cn(
        "relative h-64 md:h-[400px] flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors border-r border-white/10",
        dragOver
          ? "bg-[#3a5c47]"
          : "bg-[#2C4835]/80 hover:bg-[#3a5c47]/60"
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <>
          <Loader2 className="h-10 w-10 text-white/60 animate-spin" />
          <span className="text-white/60 text-sm font-medium">
            Uploading...
          </span>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
            <Camera className="h-8 w-8 text-white/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white/70 text-base font-serif font-medium">
              Upload Family Portrait
            </p>
            <p className="text-white/40 text-sm">
              Click or drag a photo here
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-white/30 text-white hover:bg-white/10 bg-transparent rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose Photo
          </Button>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
