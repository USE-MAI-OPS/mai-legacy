import {
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Wrench,
  BookOpen,
  GraduationCap,
  Heart,
  Users,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LegacyBoardProps {
  stats: {
    totalEntries: number;
    totalMembers: number;
    totalRecipes: number;
    totalStories: number;
    totalSkills: number;
    totalLessons: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
  }>;
  topContributor?: { name: string; count: number };
  familyName: string;
}

// ---------------------------------------------------------------------------
// Accent colors for entry types
// ---------------------------------------------------------------------------
const typeAccents: Record<string, string> = {
  recipe: "text-orange-600",
  story: "text-blue-600",
  skill: "text-green-600",
  lesson: "text-purple-600",
  connection: "text-pink-600",
  general: "text-gray-600",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function LegacyBoard({
  stats,
  recentActivity,
  topContributor,
  familyName,
}: LegacyBoardProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold">The {familyName} Legacy Board</h2>
      </div>

      {/* Asymmetrical Magazine-style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-flow-row-dense">
        {/* ---- Pin: Family Stats ---- */}
        <Card className="md:col-span-2 lg:col-span-2 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50/60 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 pb-6 h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">
                Family Snapshot
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatItem
                icon={<BookOpen className="h-4 w-4 text-blue-500" />}
                label="Entries"
                value={stats.totalEntries}
              />
              <StatItem
                icon={<Users className="h-4 w-4 text-indigo-500" />}
                label="Members"
                value={stats.totalMembers}
              />
              <StatItem
                icon={<UtensilsCrossed className="h-4 w-4 text-orange-500" />}
                label="Recipes"
                value={stats.totalRecipes}
              />
              <StatItem
                icon={<Wrench className="h-4 w-4 text-green-500" />}
                label="Skills"
                value={stats.totalSkills}
              />
            </div>
          </CardContent>
        </Card>

        {/* ---- Pin: Most Popular Recipes ---- */}
        {stats.totalRecipes > 0 && (
          <Card className="border-t-4 border-t-orange-400 bg-gradient-to-br from-orange-50/70 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-orange-800">
                  Family Recipes
                </h3>
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {stats.totalRecipes}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                recipes preserved for future generations
              </p>
              {recentActivity
                .filter((a) => a.type === "recipe")
                .slice(0, 2)
                .map((a) => (
                  <div
                    key={a.id}
                    className="mt-2 text-xs text-orange-700 bg-orange-100/60 rounded px-2 py-1"
                  >
                    {a.title}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* ---- Pin: Top Skills ---- */}
        {stats.totalSkills > 0 && (
          <Card className="border-t-4 border-t-green-400 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-800">
                  Top Skills
                </h3>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {stats.totalSkills}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                skills and how-tos shared
              </p>
              {recentActivity
                .filter((a) => a.type === "skill")
                .slice(0, 2)
                .map((a) => (
                  <div
                    key={a.id}
                    className="mt-2 text-xs text-green-700 bg-green-100/60 rounded px-2 py-1"
                  >
                    {a.title}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* ---- Pin: Recent Stories ---- */}
        {stats.totalStories > 0 && (
          <Card className="md:col-span-2 bg-gradient-to-br from-blue-50/60 to-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">
                  Recent Stories
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {stats.totalStories}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                stories keeping the family history alive
              </p>
              {recentActivity
                .filter((a) => a.type === "story")
                .slice(0, 3)
                .map((a) => (
                  <div
                    key={a.id}
                    className="mt-2 text-xs text-blue-700 bg-blue-100/50 rounded px-2 py-1"
                  >
                    {a.title}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* ---- Pin: Family Wisdom (Lessons) ---- */}
        {stats.totalLessons > 0 && (
          <Card className="border-r-4 border-r-purple-400 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-800">
                  Family Wisdom
                </h3>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {stats.totalLessons}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                lessons and wisdom passed down
              </p>
            </CardContent>
          </Card>
        )}

        {/* ---- Pin: Top Contributor ---- */}
        {topContributor && topContributor.count > 0 && (
          <Card className="border-b-4 border-b-teal-400 bg-gradient-to-br from-teal-50/60 to-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-teal-800">
                  Family Champion
                </h3>
              </div>
              <p className="text-lg font-bold text-teal-700">
                {topContributor.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {topContributor.count} contribution
                {topContributor.count !== 1 ? "s" : ""} to the family knowledge
                base
              </p>
            </CardContent>
          </Card>
        )}

        {/* ---- Pin: Family Strength ---- */}
        <Card className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-pink-50/50 to-white border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-pink-500" />
              <h3 className="text-sm font-semibold text-pink-800">
                Family Strength
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stats.totalMembers} member
              {stats.totalMembers !== 1 ? "s" : ""} contributing{" "}
              {stats.totalEntries} piece
              {stats.totalEntries !== 1 ? "s" : ""} of knowledge. Your legacy
              is growing!
            </p>
            {/* Recent activity ticker */}
            {recentActivity.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${
                        typeAccents[activity.type] ?? "text-gray-600"
                      }`}
                    >
                      {activity.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {activity.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small stat item
// ---------------------------------------------------------------------------
function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
