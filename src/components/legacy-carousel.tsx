"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, UtensilsCrossed, BookOpen, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CarouselEntry {
  id: string;
  title: string;
  content: string;
  image?: string | null;
}

interface LegacyCarouselProps {
  recipes: CarouselEntry[];
  stories: CarouselEntry[];
  skills: CarouselEntry[];
  familyName: string;
}

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------
const categories = [
  {
    key: "recipes" as const,
    label: "Recipes",
    icon: UtensilsCrossed,
    gradient: "from-orange-100 to-amber-50",
    accent: "bg-orange-400/80",
    hoverAccent: "hover:bg-orange-500",
    fallbackGradient: "from-orange-100 via-amber-50 to-orange-50",
    href: "/entries?type=recipe",
  },
  {
    key: "stories" as const,
    label: "Stories",
    icon: BookOpen,
    gradient: "from-blue-100 to-indigo-50",
    accent: "bg-blue-400/80",
    hoverAccent: "hover:bg-blue-500",
    fallbackGradient: "from-blue-100 via-indigo-50 to-blue-50",
    href: "/entries?type=story",
  },
  {
    key: "skills" as const,
    label: "Skills",
    icon: Wrench,
    gradient: "from-green-100 to-emerald-50",
    accent: "bg-green-400/80",
    hoverAccent: "hover:bg-green-500",
    fallbackGradient: "from-green-100 via-emerald-50 to-green-50",
    href: "/entries?type=skill",
  },
];

// ---------------------------------------------------------------------------
// Single column card with rotating entries
// ---------------------------------------------------------------------------
function CarouselColumn({
  entries,
  category,
}: {
  entries: CarouselEntry[];
  category: (typeof categories)[number];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const count = entries.length;

  const goTo = useCallback(
    (direction: "next" | "prev") => {
      if (count <= 1 || isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex((prev) =>
        direction === "next" ? (prev + 1) % count : (prev - 1 + count) % count
      );
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [count, isTransitioning]
  );

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (count <= 1) return;
    const interval = setInterval(() => goTo("next"), 5000);
    return () => clearInterval(interval);
  }, [count, goTo]);

  if (entries.length === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden border bg-card shadow-sm group h-[420px] flex flex-col">
        {/* Fallback gradient */}
        <div
          className={`relative h-56 bg-gradient-to-br ${category.fallbackGradient} flex items-center justify-center`}
        >
          <category.icon className="h-16 w-16 text-primary/30" />
        </div>
        <div className="flex-1 p-5 flex flex-col justify-center items-center text-center">
          <h3 className="font-semibold text-2xl mb-2">{category.label}</h3>
          <p className="text-base text-muted-foreground mb-5">
            No {category.label.toLowerCase()} yet. Be the first to add one!
          </p>
          <Button size="lg" className="rounded-full px-8 text-base" asChild>
            <Link href="/entries/new">
              Add {category.key === "stories" ? "Story" : category.key === "recipes" ? "Recipe" : "Skill"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const entry = entries[currentIndex];

  return (
    <Link href={`/entries/${entry.id}`} className="block relative rounded-2xl overflow-hidden border bg-card shadow-sm group h-[420px] flex flex-col hover:shadow-md transition-shadow">
      {/* Image / gradient area */}
      <div className="relative h-56 overflow-hidden">
        {entry.image ? (
          <img
            src={entry.image}
            alt={entry.title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${category.fallbackGradient} flex items-center justify-center transition-opacity duration-500 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <category.icon className="h-16 w-16 text-primary/30" />
          </div>
        )}
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-foreground/70 bg-white/80 backdrop-blur-sm border border-border/30"
          >
            <category.icon className="h-3.5 w-3.5" />
            {category.label}
          </span>
        </div>

        {/* Navigation arrows — visible on hover */}
        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo("prev"); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo("next"); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {entries.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentIndex(i);
                    setTimeout(() => setIsTransitioning(false), 500);
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 p-5 flex flex-col">
        <div
          className={`flex-1 transition-opacity duration-500 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <h3 className="font-semibold text-xl leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {entry.title}
          </h3>
          <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed">
            {entry.content}
          </p>
        </div>

        {/* Footer: view all link */}
        <div className="pt-3 mt-auto">
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = category.href; }}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            View all {category.label} →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main carousel component
// ---------------------------------------------------------------------------
export function LegacyCarousel({
  recipes,
  stories,
  skills,
  familyName,
}: LegacyCarouselProps) {
  const dataMap = { recipes, stories, skills };

  return (
    <div>
      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <CarouselColumn
            key={cat.key}
            entries={dataMap[cat.key]}
            category={cat}
          />
        ))}
      </div>
    </div>
  );
}
