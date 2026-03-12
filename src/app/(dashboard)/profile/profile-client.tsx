"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/stats-card";
import { MyStorySection } from "@/components/my-story-section";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  Camera,
  FileTextIcon,
  LayersIcon,
  Loader2,
  TagIcon,
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
    tutorials_created: number;
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <div className="relative group">
          <Avatar className="size-20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={user.display_name} />
            ) : null}
            <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
              {getInitials(user.display_name)}
            </AvatarFallback>
          </Avatar>

          {/* Upload overlay */}
          {userId && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
            <h1 className="text-2xl font-bold tracking-tight">
              {user.display_name}
            </h1>
            <Badge
              variant="secondary"
              className="capitalize text-xs"
            >
              {user.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDaysIcon className="size-3.5" />
            Joined {formatDate(user.joined_at)}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
        <StatsCard
          label="Entries Created"
          value={user.stats.entries_created}
          icon={<FileTextIcon className="size-5" />}
        />
        <StatsCard
          label="Tutorials Created"
          value={user.stats.tutorials_created}
          icon={<BookOpenIcon className="size-5" />}
        />
        <StatsCard
          label="Types Contributed"
          value={user.stats.types_contributed.length}
          icon={<LayersIcon className="size-5" />}
        />
      </div>

      {/* Types contributed */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TagIcon className="size-4" />
            Types Contributed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.stats.types_contributed.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className={`capitalize border-0 ${typeColors[type] || ""}`}
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Story - Life Resume */}
      <div className="mb-8">
        <MyStorySection
          initialData={lifeStory}
          onSave={memberId ? handleSaveLifeStory : undefined}
        />
      </div>

      {/* Recent contributions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No contributions yet.
            </p>
          ) : (
            <div className="space-y-1">
              {recentEntries.map((entry, i) => (
                <div key={entry.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileTextIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] capitalize border-0 px-1.5 py-0 ${
                              typeColors[entry.type] || ""
                            }`}
                          >
                            {entry.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {formatRelativeDate(entry.created_at)}
                    </span>
                  </div>
                  {i < recentEntries.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
