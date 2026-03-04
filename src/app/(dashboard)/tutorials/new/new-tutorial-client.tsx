"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
} from "lucide-react";
import { createTutorial } from "./actions";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  tips: string;
}

export interface EntryOption {
  id: string;
  title: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function NewTutorialClient({ entries }: { entries: EntryOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedEntry, setSelectedEntry] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([
    { id: generateId(), title: "", description: "", tips: "" },
  ]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: generateId(), title: "", description: "", tips: "" },
    ]);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = (
    id: string,
    field: keyof Omit<TutorialStep, "id">,
    value: string
  ) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [
      newSteps[newIndex],
      newSteps[index],
    ];
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!selectedEntry) {
      setError("Please select a connected entry.");
      return;
    }
    if (steps.some((s) => !s.title.trim() || !s.description.trim())) {
      setError("Each step needs a title and description.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await createTutorial({
      entryId: selectedEntry,
      difficulty: difficulty || "beginner",
      estimatedTime: estimatedTime || "",
      steps: steps.map((s) => ({
        title: s.title,
        description: s.description,
        tips: s.tips,
      })),
    });

    if (result.success && result.id) {
      router.push(`/tutorials/${result.id}`);
    } else {
      setError(result.error || "Failed to save tutorial");
      setSaving(false);
    }
  };

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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create Tutorial
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Turn a family knowledge entry into a step-by-step guide
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <SaveIcon className="size-4" />
          {saving ? "Saving..." : "Save Tutorial"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}

      {/* Tutorial metadata */}
      <Card className="mb-6">
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="title">Tutorial Title</Label>
            <Input
              id="title"
              placeholder="e.g., Grandma's Cornbread Recipe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry">Connected Entry</Label>
            <Select value={selectedEntry} onValueChange={setSelectedEntry}>
              <SelectTrigger id="entry" className="w-full">
                <SelectValue placeholder="Select an entry this tutorial is based on" />
              </SelectTrigger>
              <SelectContent>
                {entries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Estimated Time</Label>
              <Input
                id="time"
                placeholder="e.g., 45 min, 1 hr"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Steps builder */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Steps ({steps.length})
          </h2>
          <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5">
            <PlusIcon className="size-3.5" />
            Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className="relative">
              <CardContent className="pt-0">
                <div className="flex items-start gap-3">
                  {/* Reorder grip & step number */}
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        aria-label="Move step up"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        aria-label="Move step down"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Step fields */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Step title"
                        value={step.title}
                        onChange={(e) =>
                          updateStep(step.id, "title", e.target.value)
                        }
                        className="font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeStep(step.id)}
                        disabled={steps.length <= 1}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>

                    <Textarea
                      placeholder="Describe what to do in this step..."
                      value={step.description}
                      onChange={(e) =>
                        updateStep(step.id, "description", e.target.value)
                      }
                      rows={3}
                    />

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Tips (optional)
                      </Label>
                      <Textarea
                        placeholder="Any helpful tips, warnings, or family wisdom for this step..."
                        value={step.tips}
                        onChange={(e) =>
                          updateStep(step.id, "tips", e.target.value)
                        }
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addStep}
          className="w-full mt-4 gap-1.5 border-dashed"
        >
          <PlusIcon className="size-4" />
          Add Another Step
        </Button>
      </div>

      {/* Bottom save button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" asChild>
          <Link href="/tutorials">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <SaveIcon className="size-4" />
          {saving ? "Saving..." : "Save Tutorial"}
        </Button>
      </div>
    </div>
  );
}
