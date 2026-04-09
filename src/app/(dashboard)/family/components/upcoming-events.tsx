"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CalendarDays,
  MapPin,
  Plus,
  Check,
  HelpCircle,
  X,
  Trash2,
  Utensils,
  Sparkles,
} from "lucide-react";
import { respondToEvent, deleteEvent } from "../actions";
import { CreateEventDialog } from "./create-event-dialog";
import { toast } from "sonner";
import type { RsvpStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EventData {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  location: string | null;
  created_by: string;
}

interface RsvpData {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
}

interface UpcomingEventsProps {
  events: EventData[];
  rsvps: RsvpData[];
  familyId: string;
  currentUserId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRsvpCounts(eventId: string, rsvps: RsvpData[]) {
  const eventRsvps = rsvps.filter((r) => r.event_id === eventId);
  return {
    going: eventRsvps.filter((r) => r.status === "going").length,
    maybe: eventRsvps.filter((r) => r.status === "maybe").length,
    notGoing: eventRsvps.filter((r) => r.status === "not_going").length,
  };
}

function getUserRsvp(
  eventId: string,
  userId: string,
  rsvps: RsvpData[]
): RsvpStatus | null {
  return (
    rsvps.find((r) => r.event_id === eventId && r.user_id === userId)
      ?.status ?? null
  );
}

// ---------------------------------------------------------------------------
// RSVP buttons
// ---------------------------------------------------------------------------
function RsvpButtons({
  eventId,
  currentStatus,
  onRespond,
  isPending,
}: {
  eventId: string;
  currentStatus: RsvpStatus | null;
  onRespond: (eventId: string, status: RsvpStatus) => void;
  isPending: boolean;
}) {
  const buttons: { status: RsvpStatus; label: string; icon: React.ReactNode }[] =
    [
      { status: "going", label: "Going", icon: <Check className="h-3 w-3" /> },
      {
        status: "maybe",
        label: "Maybe",
        icon: <HelpCircle className="h-3 w-3" />,
      },
      {
        status: "not_going",
        label: "Can\u2019t",
        icon: <X className="h-3 w-3" />,
      },
    ];

  return (
    <div className="flex gap-1.5">
      {buttons.map((btn) => (
        <Button
          key={btn.status}
          variant={currentStatus === btn.status ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1 h-7 rounded-full"
          onClick={() => onRespond(eventId, btn.status)}
          disabled={isPending}
        >
          {btn.icon}
          {btn.label}
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function UpcomingEvents({
  events,
  rsvps: initialRsvps,
  familyId,
  currentUserId,
}: UpcomingEventsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic RSVP state
  const [optimisticRsvps, addOptimisticRsvp] = useOptimistic(
    initialRsvps,
    (state: RsvpData[], newRsvp: RsvpData) => {
      const filtered = state.filter(
        (r) =>
          !(r.event_id === newRsvp.event_id && r.user_id === newRsvp.user_id)
      );
      return [...filtered, newRsvp];
    }
  );

  function handleRespond(eventId: string, status: RsvpStatus) {
    startTransition(async () => {
      addOptimisticRsvp({
        event_id: eventId,
        user_id: currentUserId,
        status,
      });
      const result = await respondToEvent(eventId, status);
      if (!result.success) {
        toast.error(result.error ?? "Failed to RSVP");
      }
    });
  }

  function handleDeleteEvent(eventId: string) {
    setEventToDelete(eventId);
  }

  function confirmDeleteEvent() {
    if (!eventToDelete) return;
    const id = eventToDelete;
    setEventToDelete(null);
    startTransition(async () => {
      const result = await deleteEvent(id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete event");
      } else {
        toast.success("Event deleted");
      }
    });
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
          </div>
          <button
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Event
          </button>
        </div>

        <Card className="border-dashed border-2 border-orange-200/50 bg-orange-50/20 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 relative">
            <div className="h-24 w-24 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-6 relative z-10">
              <Utensils className="h-12 w-12 text-orange-600 dark:text-orange-400 opacity-80" />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3 text-center tracking-tight relative z-10">
              The table is waiting.
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-8 font-serif italic text-lg opacity-90 relative z-10">
              There are no upcoming events. Plan your next gathering, reunion, or simple family dinner to keep the stories flowing.
            </p>
            <Button
              size="lg"
              className="rounded-full shadow-md font-serif text-base px-8 relative z-10"
              onClick={() => setDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Plan a Gathering
            </Button>
          </CardContent>
        </Card>

        <CreateEventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          familyId={familyId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <span className="text-sm text-muted-foreground">
            ({events.length})
          </span>
        </div>
        <button
          className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Event
        </button>
      </div>

      {/* Event cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => {
          const counts = getRsvpCounts(event.id, optimisticRsvps);
          const myStatus = getUserRsvp(event.id, currentUserId, optimisticRsvps);
          const isCreator = event.created_by === currentUserId;

          return (
            <Card key={event.id} className="relative group">
              <CardContent className="pt-5 pb-4 space-y-3">
                {/* Title + delete */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">
                    {event.title}
                  </h3>
                  {isCreator && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-destructive/10"
                      aria-label="Delete event"
                      title="Delete event"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Date + location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span>
                      {formatEventDate(event.event_date)}{" \u00b7 "}
                      {formatEventTime(event.event_date)}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {/* RSVP counts */}
                <div className="flex gap-2">
                  {counts.going > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider font-semibold"
                    >
                      {counts.going} Going
                    </Badge>
                  )}
                  {counts.maybe > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 uppercase tracking-wider font-semibold"
                    >
                      {counts.maybe} Maybe
                    </Badge>
                  )}
                </div>

                {/* RSVP buttons */}
                <RsvpButtons
                  eventId={event.id}
                  currentStatus={myStatus}
                  onRespond={handleRespond}
                  isPending={isPending}
                />
              </CardContent>
            </Card>
          );
        })}

        {/* Plan a Gathering CTA card */}
        <Card className="border-dashed border-2 border-orange-200/50 bg-orange-50/20 dark:bg-orange-950/10 flex flex-col items-center justify-center text-center">
          <CardContent className="py-8 px-4 flex flex-col items-center justify-center h-full">
            <p className="text-xl font-serif italic text-muted-foreground mb-4">
              The table is waiting.
            </p>
            <Button
              className="rounded-full"
              onClick={() => setDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Plan a Gathering
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <CreateEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={familyId}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => { if (!open) setEventToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event and all RSVPs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
