"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadEntryImage } from "@/lib/supabase/storage";
import { validateImageFile } from "@/lib/upload-validation";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  familyId?: string;
  label?: string;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  familyId,
  label = "Photos",
  maxImages = 6,
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray: File[] = [];
      for (const f of Array.from(files)) {
        const check = validateImageFile(f);
        if (!check.valid) {
          toast.error(check.error);
        } else {
          fileArray.push(f);
        }
      }
      if (fileArray.length === 0) return;

      const remaining = maxImages - images.length;
      const toUpload = fileArray.slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading(true);

      // If no familyId (demo mode), use local object URLs
      if (!familyId) {
        const localUrls = toUpload.map((f) => URL.createObjectURL(f));
        onImagesChange([...images, ...localUrls]);
        setUploading(false);
        return;
      }

      // Upload to Supabase Storage
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const url = await uploadEntryImage(file, familyId);
        if (url) uploaded.push(url);
      }

      if (uploaded.length > 0) {
        onImagesChange([...images, ...uploaded]);
      }
      setUploading(false);
    },
    [images, onImagesChange, familyId, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div
              key={i}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/80"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / upload button */}
      {canAddMore && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">
                Uploading...
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Click or drag photos here
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {images.length}/{maxImages} photos
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
