"use client";

import { useState, useTransition } from "react";
import {
  CalendarHeart,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  createTradition,
  updateTradition,
  deleteTradition,
} from "@/app/(dashboard)/dashboard/tradition-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Tradition {
  id: string;
  name: string;
  description: string;
  frequency: string;
  created_by: string;
}

interface TraditionsSectionProps {
  traditions: Tradition[];
  userId?: string;
}

// ---------------------------------------------------------------------------
// Frequency helpers
// ---------------------------------------------------------------------------
const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "one-time", label: "One-time" },
];

const frequencyColors: Record<string, string> = {
  weekly: "bg-rose-100 text-rose-700 border-rose-200",
  monthly: "bg-pink-100 text-pink-700 border-pink-200",
  annual: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "one-time": "bg-purple-100 text-purple-700 border-purple-200",
};

function formatFrequency(freq: string): string {
  const found = FREQUENCY_OPTIONS.find(
    (o) => o.value === freq.toLowerCase()
  );
  return found?.label ?? freq;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function TraditionsSection({
  traditions,
  userId,
}: TraditionsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-pink-500" />
          Family Traditions
        </CardTitle>
        <AddTraditionDialog open={addOpen} onOpenChange={setAddOpen} />
      </CardHeader>
      <CardContent>
        {traditions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No traditions yet. Add your first family tradition!
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {traditions.map((tradition) => {
              const isExpanded = expandedId === tradition.id;
              const canEdit = userId === tradition.created_by;

              return (
                <div
                  key={tradition.id}
                  className="rounded-lg border border-pink-100 bg-gradient-to-br from-white to-rose-50/40 p-3 transition-all duration-200 hover:shadow-sm cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : tradition.id)
                  }
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-medium leading-tight pr-2">
                      {tradition.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          frequencyColors[tradition.frequency.toLowerCase()] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {formatFrequency(tradition.frequency)}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Description — collapsed: 2 lines, expanded: full */}
                  <p
                    className={`text-xs text-muted-foreground leading-relaxed transition-all duration-200 ${
                      isExpanded ? "" : "line-clamp-2"
                    }`}
                  >
                    {tradition.description}
                  </p>

                  {/* Expanded actions */}
                  {isExpanded && canEdit && (
                    <div
                      className="flex items-center gap-2 mt-3 pt-2 border-t border-pink-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EditTraditionDialog
                        tradition={tradition}
                        open={editOpen === tradition.id}
                        onOpenChange={(open) =>
                          setEditOpen(open ? tradition.id : null)
                        }
                      />
                      <DeleteTraditionButton
                        traditionId={tradition.id}
                        traditionName={tradition.name}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add Tradition Dialog
// ---------------------------------------------------------------------------
function AddTraditionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("annual");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setFrequency("annual");
    setError(null);
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createTradition({
        name,
        description,
        frequency,
      });
      if (result.error) {
        setError(result.error);
      } else {
        reset();
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="mr-1 h-3 w-3" />
          Add Tradition
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-pink-500" />
            Add Family Tradition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tradition-name">Name</Label>
            <Input
              id="tradition-name"
              placeholder="e.g. Sunday Family Dinner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tradition-desc">Description</Label>
            <Textarea
              id="tradition-desc"
              placeholder="Describe this tradition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tradition-freq">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Tradition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Tradition Dialog
// ---------------------------------------------------------------------------
function EditTraditionDialog({
  tradition,
  open,
  onOpenChange,
}: {
  tradition: Tradition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(tradition.name);
  const [description, setDescription] = useState(tradition.description);
  const [frequency, setFrequency] = useState(
    tradition.frequency.toLowerCase()
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateTradition(tradition.id, {
        name,
        description,
        frequency,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-pink-500" />
            Edit Tradition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor={`edit-name-${tradition.id}`}>Name</Label>
            <Input
              id={`edit-name-${tradition.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-desc-${tradition.id}`}>Description</Label>
            <Textarea
              id={`edit-desc-${tradition.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-freq-${tradition.id}`}>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Tradition Button
// ---------------------------------------------------------------------------
function DeleteTraditionButton({
  traditionId,
  traditionName,
}: {
  traditionId: string;
  traditionName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTradition(traditionId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete tradition?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{traditionName}&rdquo;. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
