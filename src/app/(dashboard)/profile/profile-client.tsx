"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/stats-card";
import { MyStorySection } from "@/components/my-story-section";
import {
  CalendarDaysIcon,
  Camera,
  Check,
  FileTextIcon,
  LayersIcon,
  Loader2,
  Pencil,
  TagIcon,
  X as XIcon,
} from "lucide-react";
import type { LifeStory } from "@/types/database";
import { createBrowserClient } from "@supabase/ssr";
import { uploadAvatar } from "@/lib/supabase/storage";
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
      const { error } = await (supabase as any)
        .from("family_members")
        .update({ display_name: trimmed })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to update display name");
        return;
      }

      // Also update linked family_tree_members
      const { data: memberRows } = await (supabase as any)
        .from("family_members")
        .select("id")
        .eq("user_id", userId);

      if (memberRows && memberRows.length > 0) {
        const memberIds = memberRows.map((m: { id: string }) => m.id);
        await (supabase as any)
          .from("family_tree_members")
          .update({ name: trimmed })
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
    const { error } = await (supabase as any)
      .from("family_members")
      .update({ life_story: story as unknown as Record<string, unknown> })
      .eq("user_id", userId || memberId);
    if (error) throw error;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
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
      const { error } = await (supabase as any)
        .from("family_members")
        .update({ avatar_url: url })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to save avatar");
        return;
      }

      // Also update family_tree_members that are linked to this user's member rows
      // Get the member IDs for this user first
      const { data: memberRows } = await (supabase as any)
        .from("family_members")
        .select("id")
        .eq("user_id", userId);

      if (memberRows && memberRows.length > 0) {
        const memberIds = memberRows.map((m: { id: string }) => m.id);
        await (supabase as any)
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
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
        <div className="relative group">
          <Avatar className="size-20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          {/* Upload overlay */}
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
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
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
                  className="text-xl font-bold h-9 w-56"
                  autoFocus
                  disabled={savingName}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={handleSaveDisplayName}
                  disabled={savingName}
                >
                  <Check className="size-4 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => {
                    setNameInput(displayName);
                    setEditingName(false);
                  }}
                  disabled={savingName}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {displayName}
                </h1>
                {userId && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-stone-400 hover:text-amber-700 transition-colors"
                    aria-label="Edit display name"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
              </>
            )}
            <Badge
              variant="outline"
              className="capitalize text-xs rounded-full border-amber-700/30 text-amber-800 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30"
            >
              {user.role}
            </Badge>
          </div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{user.email}</p>
          <div className="flex items-center gap-1.5 text-xs tracking-widest uppercase font-semibold text-stone-400">
            <CalendarDaysIcon className="size-3.5" />
            Joined {formatDate(user.joined_at)}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-12">
        <StatsCard
          label="Entries Created"
          value={user.stats.entries_created}
          icon={<FileTextIcon className="size-5" />}
        />
        <StatsCard
          label="Categories"
          value={user.stats.types_contributed.length}
          icon={<LayersIcon className="size-5" />}
        />
      </div>

      {/* Categories contributed */}
      {user.stats.types_contributed.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xs tracking-widest uppercase font-semibold text-stone-500 mb-4 flex items-center gap-2">
            <TagIcon className="size-3.5" />
            Categories Contributed
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.stats.types_contributed.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className={`capitalize border-0 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${typeColors[type] || ""}`}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* My Story - Life Resume */}
      <div className="mb-16">
        <MyStorySection
          initialData={lifeStory}
          onSave={memberId ? handleSaveLifeStory : undefined}
        />
      </div>

      {/* Timeline Journey: Recent contributions */}
      <div className="mt-8">
        <h2 className="text-2xl font-serif font-semibold mb-8 text-stone-900 dark:text-stone-100">
          Your Legacy Timeline
        </h2>
        
        {recentEntries.length === 0 ? (
          <p className="text-stone-500 italic font-serif">
            Your journey begins here. Share your first memory or recipe.
          </p>
        ) : (
          <div className="relative border-l border-stone-200 dark:border-stone-800 ml-3 md:ml-4 space-y-10 pb-8">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="relative pl-8 md:pl-10">
                {/* Timeline Node */}
                <div className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-amber-700 ring-4 ring-white dark:ring-[#161B17]" />
                
                {/* Content Card */}
                <div className="group block">
                  <span className="text-xs font-semibold tracking-widest uppercase text-stone-500 mb-2 block">
                    {formatRelativeDate(entry.created_at)}
                  </span>
                  <div className="bg-white dark:bg-[#1A221C] border border-stone-200 dark:border-[#2C3B2F] rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                          {entry.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] uppercase tracking-wider font-semibold border-0 px-2.5 py-0.5 rounded-full ${
                            typeColors[entry.type] || "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300"
                          }`}
                        >
                          {entry.type}
                        </Badge>
                      </div>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-50 dark:bg-[#232F26] text-stone-400 group-hover:text-amber-700 transition-colors">
                        <FileTextIcon className="size-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* End of Timeline Indicator */}
            <div className="absolute -left-[5px] bottom-0 size-2.5 rounded-full border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-[#161B17]" />
          </div>
        )}
      </div>
    </div>
  );
}
