"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  entryId: string;
  entryTitle: string;
}

export function ShareButton({ entryId, entryTitle }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    setSupportsNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const entryUrl = `${origin}/entries/${entryId}`;
  const shareImageUrl = `${origin}/api/share/${entryId}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(entryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = entryUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDownloadImage() {
    try {
      const response = await fetch(shareImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entryTitle.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-share.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download image. Please try again.");
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: entryTitle,
          text: `Check out "${entryTitle}" on MAI Legacy`,
          url: entryUrl,
        });
      } catch {
        // User cancelled or share failed — no action needed
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="size-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="size-4 mr-2 text-green-600" />
          ) : (
            <Copy className="size-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadImage}>
          <Download className="size-4 mr-2" />
          Download image
        </DropdownMenuItem>

        {supportsNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="size-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
