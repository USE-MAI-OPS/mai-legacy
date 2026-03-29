"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Loader2,
  Trophy,
  Trash2,
} from "lucide-react";
import type { GoalStatus } from "@/types/database";
import {
  createGoal,
  incrementProgress,
  deleteGoal,
  type FamilyGoal,
} from "./actions";

type FilterTab = "all" | GoalStatus;

const statusColors: Record<GoalStatus, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  archived:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function GoalsClient({
  initialGoals,
}: {
  initialGoals: FamilyGoal[];
}) {
  const [goals, setGoals] = useState<FamilyGoal[]>(initialGoals);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCount, setTargetCount] = useState(1);
  const [dueDate, setDueDate] = useState("");

  const filteredGoals =
    filter === "all" ? goals : goals.filter((g) => g.status === filter);

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "Archived", value: "archived" },
  ];

  function resetForm() {
    setTitle("");
    setDescription("");
    setTargetCount(1);
    setDueDate("");
  }

  function handleCreate() {
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createGoal({
        title,
        description,
        targetCount,
        dueDate: dueDate || undefined,
      });

      if (result.success) {
        // Optimistically add the goal to the list
        const newGoal: FamilyGoal = {
          id: crypto.randomUUID(),
          family_id: "",
          title: title.trim(),
          description: description.trim(),
          target_count: targetCount,
          current_count: 0,
          status: "active",
          assigned_to: [],
          due_date: dueDate || null,
          created_by: "",
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setGoals((prev) => [newGoal, ...prev]);
        resetForm();
        setDialogOpen(false);
      }
    });
  }

  function handleIncrement(goalId: string) {
    startTransition(async () => {
      const result = await incrementProgress(goalId);

      if (result.success) {
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== goalId) return g;
            const newCount = g.current_count + 1;
            const isComplete = newCount >= g.target_count;
            return {
              ...g,
              current_count: newCount,
              status: isComplete ? "completed" : g.status,
              completed_at: isComplete ? new Date().toISOString() : g.completed_at,
            };
          })
        );
      }
    });
  }

  function handleDelete(goalId: string) {
    setGoalToDelete(goalId);
  }

  function confirmDelete() {
    if (!goalToDelete) return;
    const id = goalToDelete;
    setGoalToDelete(null);
    startTransition(async () => {
      const result = await deleteGoal(id);
      if (result.success) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      }
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getProgressPercent(current: number, target: number) {
    if (target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="size-8" />
            Family Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and celebrate your family&apos;s shared goals together.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Goal</DialogTitle>
              <DialogDescription>
                Set a goal for your family to work toward together.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Title</Label>
                <Input
                  id="goal-title"
                  placeholder="e.g. Record 10 family recipes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-description">Description</Label>
                <Textarea
                  id="goal-description"
                  placeholder="What is this goal about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Count</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    min={1}
                    value={targetCount}
                    onChange={(e) =>
                      setTargetCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-due">Due Date (optional)</Label>
                  <Input
                    id="goal-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !title.trim()}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  "Create Goal"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
            <Target className="size-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {filter === "all"
              ? "No goals yet"
              : `No ${filter} goals`}
          </h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            {filter === "all"
              ? "Create your first family goal to start tracking progress together."
              : `You don\u2019t have any ${filter} goals right now.`}
          </p>
          {filter === "all" && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4 mr-1.5" />
              Create your first goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredGoals.map((goal) => {
            const percent = getProgressPercent(
              goal.current_count,
              goal.target_count
            );
            const isCompleted = goal.status === "completed";

            return (
              <Card
                key={goal.id}
                className={`relative transition-shadow hover:shadow-md ${
                  isCompleted
                    ? "ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/30 dark:bg-blue-950/20"
                    : ""
                }`}
              >
                {isCompleted && (
                  <div className="absolute top-3 right-3 text-2xl" aria-label="Completed celebration">
                    🎉
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 pr-8">
                    <CardTitle className="text-base leading-snug">
                      {goal.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] capitalize border-0 ${
                        statusColors[goal.status]
                      }`}
                    >
                      {goal.status === "completed" && (
                        <CheckCircle2 className="size-3 mr-0.5" />
                      )}
                      {goal.status}
                    </Badge>
                    {goal.due_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatDate(goal.due_date)}
                      </span>
                    )}
                  </div>
                  {goal.description && (
                    <CardDescription className="line-clamp-2 text-sm mt-1">
                      {goal.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {goal.current_count}/{goal.target_count} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} />
                  </div>

                  {/* Completed celebration */}
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium">
                      <Trophy className="size-4" />
                      Goal achieved!
                      {goal.completed_at && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          on {formatDate(goal.completed_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {goal.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={isPending}
                          onClick={() => handleIncrement(goal.id)}
                        >
                          {isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Plus className="size-3.5" />
                          )}
                          Progress
                        </Button>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the goal and all its progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
