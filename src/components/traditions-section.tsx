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
  Clock,
  Camera,
  PartyPopper,
} from "lucide-react";

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
  addTraditionMemory,
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
  next_occurrence?: string | null;
  last_celebrated?: string | null;
  cover_image?: string | null;
  participants?: string[] | null;
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

function getCountdownText(nextDate: string | null | undefined): string | null {
  if (!nextDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(nextDate + "T00:00:00");
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null; // past date
  if (diffDays === 0) return "Today!";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `${diffDays} days away`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks away`;
  return `${Math.ceil(diffDays / 30)} months away`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [memoryOpen, setMemoryOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-semibold">Our Traditions</h2>
        </div>
        <AddTraditionDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>

      {traditions.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <CalendarHeart className="h-10 w-10 text-pink-200 mx-auto" />
          <p className="text-sm text-muted-foreground">
            No traditions yet. Add your first family tradition!
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Tradition
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {traditions.map((tradition) => {
            const isExpanded = expandedId === tradition.id;
            const canEdit = userId === tradition.created_by;
            const countdown = getCountdownText(tradition.next_occurrence);

            return (
              <div
                key={tradition.id}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer group"
                onClick={() =>
                  setExpandedId(isExpanded ? null : tradition.id)
                }
              >
                  {/* Cover image */}
                  {tradition.cover_image && (
                    <div className="h-28 overflow-hidden">
                      <img
                        src={tradition.cover_image}
                        alt={tradition.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold leading-tight pr-2">
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

                    {/* Countdown badge */}
                    {countdown && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="h-3 w-3 text-pink-500" />
                        <span className={`text-xs font-medium ${
                          countdown === "Today!" || countdown === "Tomorrow"
                            ? "text-pink-600"
                            : "text-muted-foreground"
                        }`}>
                          {countdown}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <p
                      className={`text-xs text-muted-foreground leading-relaxed transition-all duration-200 ${
                        isExpanded ? "" : "line-clamp-2"
                      }`}
                    >
                      {tradition.description}
                    </p>

                    {/* Last celebrated */}
                    {tradition.last_celebrated && (
                      <p className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-1">
                        <PartyPopper className="h-3 w-3" />
                        Last celebrated: {formatDate(tradition.last_celebrated)}
                      </p>
                    )}

                    {/* Expanded actions */}
                    {isExpanded && (
                      <div
                        className="flex items-center gap-2 mt-3 pt-3 border-t border-pink-100 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AddMemoryDialog
                          traditionId={tradition.id}
                          traditionName={tradition.name}
                          open={memoryOpen === tradition.id}
                          onOpenChange={(open) =>
                            setMemoryOpen(open ? tradition.id : null)
                          }
                        />
                        {canEdit && (
                          <>
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
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
  const [nextDate, setNextDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setFrequency("annual");
    setNextDate("");
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
        next_occurrence: nextDate || null,
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
              placeholder="Describe this tradition and what it means to your family..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="tradition-next">Next Occurrence</Label>
              <Input
                id="tradition-next"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                disabled={isPending}
              />
            </div>
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
  const [nextDate, setNextDate] = useState(tradition.next_occurrence ?? "");
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
        next_occurrence: nextDate || null,
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
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor={`edit-next-${tradition.id}`}>Next Occurrence</Label>
              <Input
                id={`edit-next-${tradition.id}`}
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                disabled={isPending}
              />
            </div>
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
// Add Memory Dialog
// ---------------------------------------------------------------------------
function AddMemoryDialog({
  traditionId,
  traditionName,
  open,
  onOpenChange,
}: {
  traditionId: string;
  traditionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [celebratedOn, setCelebratedOn] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setContent("");
    setCelebratedOn(new Date().toISOString().split("T")[0]);
    setError(null);
  }

  function handleSubmit() {
    if (!content.trim()) {
      setError("Please add a note about this celebration.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addTraditionMemory({
        tradition_id: traditionId,
        content,
        celebrated_on: celebratedOn || null,
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
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50">
          <Camera className="h-3 w-3 mr-1" />
          Add Memory
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-pink-500" />
            Add Memory — {traditionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="memory-date">When did you celebrate?</Label>
            <Input
              id="memory-date"
              type="date"
              value={celebratedOn}
              onChange={(e) => setCelebratedOn(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memory-content">What happened?</Label>
            <Textarea
              id="memory-content"
              placeholder="Share what made this time special..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-pink-600 hover:bg-pink-700">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Memory
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
            This will permanently delete &ldquo;{traditionName}&rdquo; and all
            its memories. This action cannot be undone.
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
