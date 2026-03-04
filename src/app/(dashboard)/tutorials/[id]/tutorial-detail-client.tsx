"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InfoIcon,
  ListOrderedIcon,
} from "lucide-react";

export interface TutorialStep {
  title: string;
  description: string;
  tips?: string;
}

export interface TutorialData {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: string;
  entry_title: string;
  steps: TutorialStep[];
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function TutorialDetailClient({
  tutorial,
}: {
  tutorial: TutorialData | null;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!tutorial) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold mb-2">Tutorial not found</h2>
          <p className="text-muted-foreground mb-6">
            This tutorial doesn&apos;t exist or has been removed.
          </p>
          <Button asChild variant="outline">
            <Link href="/tutorials">
              <ArrowLeftIcon className="size-4 mr-1.5" />
              Back to tutorials
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const step = tutorial.steps[currentStep];
  const totalSteps = tutorial.steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Back link */}
      <Link
        href="/tutorials"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to tutorials
      </Link>

      {/* Tutorial header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {tutorial.title}
          </h1>
          <Badge
            variant="secondary"
            className={`shrink-0 text-[10px] capitalize border-0 mt-1 ${
              difficultyColors[tutorial.difficulty]
            }`}
          >
            {tutorial.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ListOrderedIcon className="size-3.5" />
            {totalSteps} steps
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {tutorial.estimated_time}
          </span>
          <span>
            From:{" "}
            <span className="font-medium text-foreground">
              {tutorial.entry_title}
            </span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step navigation pills */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {tutorial.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === currentStep
                ? "bg-primary text-primary-foreground"
                : i < currentStep
                ? "bg-muted text-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="size-4 flex items-center justify-center rounded-full text-[10px]">
              {i + 1}
            </span>
            <span className="hidden sm:inline truncate max-w-[120px]">
              {s.title}
            </span>
          </button>
        ))}
      </div>

      <Separator className="mb-6" />

      {/* Current step content */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            {currentStep + 1}. {step.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            {step.description}
          </p>
        </div>

        {step.tips && (
          <Card className="border-primary/20 bg-primary/5 py-4">
            <CardContent className="flex gap-3 px-5">
              <InfoIcon className="size-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-0.5">Tip</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.tips}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-10">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ChevronLeftIcon className="size-4" />
          Previous
        </Button>
        <Button
          onClick={() => setCurrentStep((prev) => prev + 1)}
          disabled={currentStep === totalSteps - 1}
          className="gap-1.5"
        >
          Next
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
