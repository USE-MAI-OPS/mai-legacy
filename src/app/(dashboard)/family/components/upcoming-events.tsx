"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MapPin,
  Plus,
  Check,
  HelpCircle,
  X,
  Trash2,
  Utensils,
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
    weekday: "short",
    month: "short",
    day: "numeric",
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
        label: "Can't",
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
          className="text-xs gap-1 h-7"
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
  const [isPending, startTransition] = useTransition();

  // Optimistic RSVP state
  const [optimisticRsvps, addOptimisticRsvp] = useOptimistic(
    initialRsvps,
    (state: RsvpData[], newRsvp: RsvpData) => {
      // Remove existing RSVP for this user/event, add new one
      const filtered = state.filter(
        (r) =>
          !(r.event_id === newRsvp.event_id && r.user_id === newRsvp.user_id)
      );
      return [...filtered, newRsvp];
    }
  );

  function handleRespond(eventId: string, status: RsvpStatus) {
    startTransition(async () => {
      // Optimistic update
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
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      const result = await deleteEvent(eventId);
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
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Event
          </Button>
        </div>

        <Card className="border-dashed bg-muted/30 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply" />
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
              <Plus className="mr-2 h-5 w-5" />
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
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Event
        </Button>
      </div>

      {/* Event cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((event) => {
          const counts = getRsvpCounts(event.id, optimisticRsvps);
          const myStatus = getUserRsvp(event.id, currentUserId, optimisticRsvps);
          const isCreator = event.created_by === currentUserId;

          return (
            <Card key={event.id} className="relative group">
              <CardContent className="pt-5 pb-4 space-y-3">
                {/* Title + delete */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-tight">
                    {event.title}
                  </h3>
                  {isCreator && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-destructive/10"
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
                      {formatEventDate(event.event_date)} at{" "}
                      {formatEventTime(event.event_date)}
                      {event.end_date &&
                        ` \u2013 ${formatEventDate(event.end_date)}`}
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
                      className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      {counts.going} going
                    </Badge>
                  )}
                  {counts.maybe > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    >
                      {counts.maybe} maybe
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
      </div>

      {/* Dialog */}
      <CreateEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={familyId}
      />
    </div>
  );
}
