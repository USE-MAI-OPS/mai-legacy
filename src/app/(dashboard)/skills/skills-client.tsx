"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SkillEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorName: string;
  date: string;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  hasTutorial: boolean;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const difficultyOptions = ["all", "beginner", "intermediate", "advanced"] as const;

export default function SkillsClient({
  initialSkills,
}: {
  initialSkills: SkillEntry[];
}) {
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const filteredSkills = useMemo(() => {
    return initialSkills.filter((skill) => {
      const matchesSearch = skill.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === "all" || skill.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [initialSkills, search, difficultyFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wrench className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Family Skills Hub
          </h1>
        </div>
        <Button asChild>
          <Link href="/entries/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((option) => (
            <Button
              key={option}
              variant={difficultyFilter === option ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficultyFilter(option)}
              className="capitalize"
            >
              {option === "all" ? "All Levels" : option}
            </Button>
          ))}
        </div>
      </div>

      {/* Skills grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <Link key={skill.id} href={`/entries/${skill.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">
                      {skill.title}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {skill.difficulty && (
                        <Badge
                          variant="secondary"
                          className={`text-xs capitalize ${difficultyColors[skill.difficulty]}`}
                        >
                          {skill.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {skill.content}
                  </p>
                  {skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {skill.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 text-xs text-muted-foreground">
                  <span>
                    {skill.authorName} &middot;{" "}
                    {new Date(skill.date).toLocaleDateString()}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            No skills documented yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start building your family&apos;s knowledge base by adding the first
            skill.
          </p>
          <Button asChild>
            <Link href="/entries/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Skill
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
