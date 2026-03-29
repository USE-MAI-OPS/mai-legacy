"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PARAGRAPHS_PER_PAGE = 4;

interface StoryPaginatorProps {
  paragraphs: string[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    pages.push(arr.slice(i, i + size));
  }
  return pages;
}

export function StoryPaginator({ paragraphs }: StoryPaginatorProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [fading, setFading] = useState(false);

  const pages = chunk(paragraphs, PARAGRAPHS_PER_PAGE);
  const totalPages = pages.length;

  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= totalPages || page === currentPage || fading) return;
      setFading(true);
      setTimeout(() => {
        setCurrentPage(page);
        setFading(false);
      }, 200);
    },
    [totalPages, currentPage, fading]
  );

  // Keyboard navigation
  useEffect(() => {
    if (totalPages <= 1) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToPage(currentPage - 1);
      if (e.key === "ArrowRight") goToPage(currentPage + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToPage, currentPage, totalPages]);

  // No pagination needed for short stories
  if (totalPages <= 1) {
    return (
      <div className="max-w-none">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-6 text-lg leading-relaxed text-foreground/90 last:mb-0">
            {p}
          </p>
        ))}
      </div>
    );
  }

  const currentParagraphs = pages[currentPage];

  return (
    <div className="space-y-6">
      {/* Story page */}
      <div
        className={`bg-amber-50/20 dark:bg-amber-950/10 rounded-2xl p-8 sm:p-10 border border-border/40 min-h-[300px] transition-opacity duration-200 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {currentParagraphs.map((p, i) => (
          <p
            key={`${currentPage}-${i}`}
            className="mb-6 text-lg leading-relaxed text-foreground/90 font-serif last:mb-0"
          >
            {p}
          </p>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0 || fading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground font-medium">
          Page {currentPage + 1} of {totalPages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1 || fading}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
