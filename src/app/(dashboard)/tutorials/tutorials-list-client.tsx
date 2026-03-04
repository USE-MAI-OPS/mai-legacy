"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpenIcon,
  ClockIcon,
  ListOrderedIcon,
  PlusIcon,
} from "lucide-react";

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: string;
  step_count: number;
  entry_title: string;
}

const difficultyColors: Record<Tutorial["difficulty"], string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function TutorialsListClient({ tutorials }: { tutorials: Tutorial[] }) {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Skill Tutorials
          </h1>
          <p className="text-muted-foreground mt-1">
            Step-by-step guides built from your family&apos;s knowledge
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/tutorials/new">
            <PlusIcon className="size-4" />
            Create Tutorial
          </Link>
        </Button>
      </div>

      {/* Tutorials grid */}
      {tutorials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
            <BookOpenIcon className="size-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No tutorials yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Turn your family&apos;s knowledge entries into step-by-step
            tutorials that anyone can follow.
          </p>
          <Button asChild>
            <Link href="/tutorials/new">Create your first tutorial</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {tutorial.title}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] capitalize border-0 ${
                        difficultyColors[tutorial.difficulty]
                      }`}
                    >
                      {tutorial.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm">
                    {tutorial.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ListOrderedIcon className="size-3.5" />
                      {tutorial.step_count} steps
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="size-3.5" />
                      {tutorial.estimated_time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    From:{" "}
                    <span className="font-medium text-foreground">
                      {tutorial.entry_title}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
