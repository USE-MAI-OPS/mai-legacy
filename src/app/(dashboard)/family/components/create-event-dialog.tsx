"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "../actions";
import { toast } from "sonner";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  familyId,
}: CreateEventDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocation("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !eventDate || !eventTime) return;

    startTransition(async () => {
      try {
        const result = await createEvent({
          familyId,
          title: title.trim(),
          description: description.trim(),
          eventDate: new Date(`${eventDate}T${eventTime}`).toISOString(),
          endDate: null,
          location: location.trim() || null,
        });
        if (!result.success) {
          toast.error(result.error ?? "Failed to create event");
          return;
        }
        toast.success("Event created!");
        onOpenChange(false);
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
            Plan a family gathering. Members can RSVP once it&apos;s posted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="eventTitle">Title *</Label>
            <Input
              id="eventTitle"
              placeholder="e.g. Family Reunion 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventDesc">Description</Label>
            <Textarea
              id="eventDesc"
              placeholder="What's the plan?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventTime">Time *</Label>
              <Input
                id="eventTime"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventLocation">Location</Label>
            <Input
              id="eventLocation"
              placeholder="e.g. Grandma's House, Memphis TN"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim() || !eventDate || !eventTime}>
              {isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
