"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MyStorySection } from "@/components/my-story-section";
import {
  BookOpen,
  Briefcase,
  CalendarDaysIcon,
  Camera,
  Check,
  ChevronRight,
  FileTextIcon,
  GraduationCap,
  Heart,
  LayersIcon,
  Lightbulb,
  Loader2,
  MapPin,
  Medal,
  Pencil,
  Utensils,
  Wrench,
  X as XIcon,
} from "lucide-react";
import type { LifeStory } from "@/types/database";
import { normalizeLifeStory } from "@/types/database";
import { createBrowserClient } from "@supabase/ssr";
import { uploadAvatar } from "@/lib/supabase/storage";
import { validateImageFile, MAX_AVATAR_SIZE_BYTES } from "@/lib/upload-validation";
import { toast } from "sonner";

export interface ProfileUser {
  display_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  joined_at: string;
  stats: {
    entries_created: number;
    types_contributed: string[];
  };
}

export interface RecentEntry {
  id: string;
  title: string;
  type: string;
  created_at: string;
}

const typeColors: Record<string, string> = {
  story: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  skill: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  lesson: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  connection: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

export function ProfileClient({
  user,
  recentEntries,
  lifeStory,
  memberId,
  userId,
}: {
  user: ProfileUser;
  recentEntries: RecentEntry[];
  lifeStory?: LifeStory;
  memberId?: string;
  userId?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.display_name);
  const [savingName, setSavingName] = useState(false);

  const handleSaveDisplayName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === displayName || !userId) return;

    setSavingName(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Update display_name on ALL family_members rows for this user
      const { error } = await supabase
        .from("family_members")
        .update({ display_name: trimmed })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to update display name");
        return;
      }

      // Also update linked family_tree_members
      const { data: memberRows } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", userId);

      if (memberRows && memberRows.length > 0) {
        const memberIds = memberRows.map((m) => m.id);
        await supabase
          .from("family_tree_members")
          .update({ display_name: trimmed })
          .in("linked_member_id", memberIds);
      }

      setDisplayName(trimmed);
      setEditingName(false);
      toast.success("Display name updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveLifeStory = async (story: LifeStory) => {
    if (!userId && !memberId) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Update ALL family_members rows for this user so profile syncs across families
    const { error } = await supabase
      .from("family_members")
      .update({ life_story: story })
      .eq("user_id", userId || memberId);
    if (error) throw error;
  };

  // Entry type icons for recent entries
  const typeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    story: { icon: BookOpen, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/40" },
    recipe: { icon: Utensils, color: "text-red-600 bg-red-100 dark:bg-red-900/40" },
    skill: { icon: Wrench, color: "text-green-600 bg-green-100 dark:bg-green-900/40" },
    lesson: { icon: Lightbulb, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
  };

  // Derive life journey data
  const story = lifeStory ? normalizeLifeStory(lifeStory) : { career: [], places: [], education: [], milestones: [], skills: [], hobbies: [], military: null };
  const skillsAndHobbies = [...story.skills, ...story.hobbies];
  const hasLifeJourney = story.places.length > 0 || story.career.length > 0 || story.education.length > 0 || story.milestones.length > 0;
  const firstName = displayName.split(" ")[0];
  const familyName = displayName.split(" ").pop() ?? "";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const check = validateImageFile(file, MAX_AVATAR_SIZE_BYTES);
    if (!check.valid) {
      toast.error(check.error);
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file, userId);
      if (!url) {
        toast.error("Failed to upload avatar");
        return;
      }

      // Update avatar_url on ALL family_members rows for this user
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase
        .from("family_members")
        .update({ avatar_url: url })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to save avatar");
        return;
      }

      // Also update family_tree_members that are linked to this user's member rows
      // Get the member IDs for this user first
      const { data: memberRows } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", userId);

      if (memberRows && memberRows.length > 0) {
        const memberIds = memberRows.map((m) => m.id);
        await supabase
          .from("family_tree_members")
          .update({ avatar_url: url })
          .in("linked_member_id", memberIds);
      }

      setAvatarUrl(url);
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUploadingAvatar(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* ─── Hero Section ─── */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative group mb-4">
          <Avatar className="h-28 w-28 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          {userId && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                aria-label="Change profile picture"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </>
          )}
        </div>

        {/* Name with inline edit */}
        <div className="flex items-center gap-2 mb-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDisplayName();
                  if (e.key === "Escape") {
                    setNameInput(displayName);
                    setEditingName(false);
                  }
                }}
                className="text-xl font-bold h-9 w-56 text-center"
                autoFocus
                disabled={savingName}
              />
              <Button size="icon" variant="ghost" className="size-7" onClick={handleSaveDisplayName} disabled={savingName}>
                <Check className="size-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => { setNameInput(displayName); setEditingName(false); }} disabled={savingName}>
                <XIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                {displayName}
              </h1>
              {userId && (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-muted-foreground hover:text-[#C17B54] transition-colors"
                  aria-label="Edit display name"
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-[#C17B54] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#C17B54]/90 border-0">
            {user.role}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {user.email} · Joined {new Date(user.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="text-center py-6">
          <CardContent className="p-0 flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <FileTextIcon className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{user.stats.entries_created}</p>
            <p className="text-xs text-muted-foreground">Memories Created</p>
          </CardContent>
        </Card>

        <Card className="text-center py-6">
          <CardContent className="p-0 flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <LayersIcon className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold">{user.stats.types_contributed.length} Types Contributed</p>
            <div className="flex flex-wrap justify-center gap-1">
              {user.stats.types_contributed.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={`text-[9px] uppercase tracking-wider font-bold border-0 px-1.5 py-0 ${typeColors[type] || ""}`}
                >
                  {type}s
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center py-6">
          <CardContent className="p-0 flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm font-bold">Skills & Hobbies</p>
            <p className="text-xs text-muted-foreground">
              {skillsAndHobbies.length > 0 ? skillsAndHobbies.join(", ") : "None listed yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Life Journey ─── */}
      {hasLifeJourney && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
              <span className="text-base">🗺️</span>
              Life Journey
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {story.places.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Places Lived
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.places.map((p, i) => (
                      <p key={i} className="text-sm">
                        {p.city}, {p.state}
                        {p.years && <span className="text-muted-foreground"> ({p.years})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {story.career.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Career
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.career.map((job, i) => (
                      <p key={i} className="text-sm">
                        {job.title}
                        {job.company && <span className="text-muted-foreground">, {job.years} at {job.company}</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {story.education.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Education
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.education.map((edu, i) => (
                      <p key={i} className="text-sm">
                        {edu.school}
                        {edu.degree && <span className="text-muted-foreground">, {edu.degree}</span>}
                        {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {story.milestones.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Milestones
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-6">
                    {story.milestones.map((m, i) => (
                      <p key={i} className="text-sm">
                        {m.event}
                        {m.year && <span className="text-muted-foreground"> ({m.year})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {story.military && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Medal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Military Service
                    </span>
                  </div>
                  <p className="text-sm ml-6">
                    {story.military.branch}
                    {story.military.rank && <span className="text-muted-foreground"> &mdash; {story.military.rank}</span>}
                    {story.military.years && <span className="text-muted-foreground"> ({story.military.years})</span>}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── My Story (Editable) ─── */}
      <div className="mb-8">
        <MyStorySection
          initialData={lifeStory}
          onSave={memberId ? handleSaveLifeStory : undefined}
        />
      </div>

      {/* ─── Recent from [Name] ─── */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Recent from {firstName}
            </h2>
          </div>

          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Your journey begins here. Share your first memory or recipe.
            </p>
          ) : (
            <div>
              {recentEntries.map((entry, i) => {
                const typeInfo = typeIcons[entry.type] ?? {
                  icon: FileTextIcon,
                  color: "text-gray-600 bg-gray-100 dark:bg-gray-900/40",
                };
                const TypeIcon = typeInfo.icon;

                return (
                  <div key={entry.id}>
                    <div className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeInfo.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="secondary"
                            className={`text-[9px] uppercase tracking-wider font-bold border-0 px-1.5 py-0 ${typeColors[entry.type] || ""}`}
                          >
                            {entry.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            &middot; {formatRelativeDate(entry.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    {i < recentEntries.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Footer ─── */}
      <div className="flex flex-col items-center gap-2 py-6">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-[#C17B54]/30" />
          <Heart className="h-3.5 w-3.5 text-[#C17B54]/40" />
          <div className="h-px w-12 bg-[#C17B54]/30" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Preserving the {familyName} Legacy
        </p>
      </div>
    </div>
  );
}
