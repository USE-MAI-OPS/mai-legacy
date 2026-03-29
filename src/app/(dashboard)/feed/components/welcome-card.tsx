"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "mai-welcome-card-dismissed";

interface WelcomeCardProps {
  familyName: string;
  entryCount: number;
}

export function WelcomeCard({ familyName, entryCount }: WelcomeCardProps) {
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  // Only show for new-ish users (few entries)
  if (dismissed || entryCount > 5) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  }

  return (
    <Card className="overflow-hidden border-0 mb-4">
      <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <h2 className="text-xl font-bold font-serif mb-1">
          Welcome to {familyName || "your family"}&apos;s legacy
        </h2>
        <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
          Start preserving your family&apos;s stories, recipes, skills, and
          lessons. Every entry you add becomes a piece of your living legacy.
        </p>

        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          asChild
        >
          <Link href="/entries/new">
            Add your first entry
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
