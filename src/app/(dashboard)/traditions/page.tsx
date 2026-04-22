import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarHeart,
  Clock,
  PartyPopper,
  Users,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import { getFamilyContext } from "@/lib/get-family-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TraditionRow {
  id: string;
  family_id: string;
  name: string;
  description: string | null;
  frequency: string;
  next_occurrence: string | null;
  last_celebrated: string | null;
  cover_image: string | null;
}

interface HubHeader {
  id: string;
  name: string;
  type: "family" | "circle";
}

// ---------------------------------------------------------------------------
// Helpers mirroring traditions-section so the cross-hub view looks identical
// ---------------------------------------------------------------------------
const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
  "one-time": "One-time",
};

const frequencyColors: Record<string, string> = {
  weekly: "bg-rose-100 text-rose-700 border-rose-200",
  monthly: "bg-pink-100 text-pink-700 border-pink-200",
  annual: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "one-time": "bg-purple-100 text-purple-700 border-purple-200",
};

function formatFrequency(freq: string): string {
  return FREQUENCY_LABELS[freq.toLowerCase()] ?? freq;
}

function getCountdownText(nextDate: string | null | undefined): string | null {
  if (!nextDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(nextDate + "T00:00:00");
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null;
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
// Page — aggregated read-only view of traditions across every hub the viewer
// belongs to. Creation + editing still happens on the per-hub /family page.
// ---------------------------------------------------------------------------
export default async function TraditionsOverviewPage() {
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }
  const { familyIds, supabase } = ctx;

  const [traditionsRes, hubsRes] = await Promise.all([
    supabase
      .from("family_traditions")
      .select(
        "id, family_id, name, description, frequency, next_occurrence, last_celebrated, cover_image"
      )
      .in("family_id", familyIds)
      .order("next_occurrence", { ascending: true, nullsFirst: false }),
    supabase
      .from("families")
      .select("id, name, type")
      .in("id", familyIds),
  ]);

  const traditions = (traditionsRes.data ?? []) as TraditionRow[];
  const hubs = (hubsRes.data ?? []) as HubHeader[];
  const hubById = new Map(hubs.map((h) => [h.id, h]));

  // Group traditions by hub. Hubs with 0 traditions still appear so the user
  // knows where to add the first one.
  const groups = hubs.map((h) => ({
    hub: h,
    traditions: traditions.filter((t) => t.family_id === h.id),
  }));

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarHeart className="h-6 w-6 text-pink-500" />
            <h1 className="text-3xl font-bold font-serif">Traditions</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Every tradition across every family and circle you belong to, in
            one place. To add or edit a tradition, open the hub it belongs to.
          </p>
        </div>
      </div>

      {/* Empty state (no hubs at all — shouldn't happen post-onboarding) */}
      {hubs.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <CalendarHeart className="h-10 w-10 text-pink-200 mx-auto" />
          <p className="text-sm text-muted-foreground">
            You&apos;re not part of any family or circle yet.
          </p>
        </div>
      )}

      {/* Grouped by hub */}
      {groups.map(({ hub, traditions: hubTraditions }) => (
        <section key={hub.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hub.type === "circle" ? (
                <CircleDot className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
              <h2 className="text-lg font-semibold font-serif">{hub.name}</h2>
              <Badge variant="outline" className="text-[10px]">
                {hub.type === "circle" ? "Circle" : "Family"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {hubTraditions.length} tradition
                {hubTraditions.length === 1 ? "" : "s"}
              </span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/family#traditions">
                Open hub
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {hubTraditions.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No traditions in {hub.name} yet.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hubTraditions.map((t) => {
                const countdown = getCountdownText(t.next_occurrence);
                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    {t.cover_image && (
                      <div className="h-28 overflow-hidden">
                        <img
                          src={t.cover_image}
                          alt={t.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="text-sm font-semibold leading-tight">
                          {t.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            frequencyColors[t.frequency.toLowerCase()] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatFrequency(t.frequency)}
                        </Badge>
                      </div>
                      {countdown && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="h-3 w-3 text-pink-500" />
                          <span
                            className={`text-xs font-medium ${
                              countdown === "Today!" ||
                              countdown === "Tomorrow"
                                ? "text-pink-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {countdown}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {t.description ?? ""}
                      </p>
                      {t.last_celebrated && (
                        <p className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-1">
                          <PartyPopper className="h-3 w-3" />
                          Last celebrated: {formatDate(t.last_celebrated)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
