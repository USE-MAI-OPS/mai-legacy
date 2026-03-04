import { createClient } from "@/lib/supabase/server";
import {
  ProfileClient,
  type ProfileUser,
  type RecentEntry,
} from "./profile-client";
import { normalizeLifeStory } from "@/types/database";
import type { LifeStory } from "@/types/database";

const MOCK_USER: ProfileUser = {
  display_name: "Marcus Powell",
  email: "marcus@example.com",
  role: "admin",
  avatar_url: null,
  joined_at: "2024-08-15T00:00:00Z",
  stats: {
    entries_created: 24,
    tutorials_created: 3,
    types_contributed: ["story", "recipe", "skill", "lesson"],
  },
};

const MOCK_RECENT_ENTRIES: RecentEntry[] = [
  {
    id: "entry-1",
    title: "Grandma Mae's Cornbread",
    type: "recipe",
    created_at: "2025-02-28T14:30:00Z",
  },
  {
    id: "entry-2",
    title: "Family Reunion History",
    type: "story",
    created_at: "2025-02-25T10:15:00Z",
  },
  {
    id: "entry-3",
    title: "How to Fix a Leaky Faucet",
    type: "skill",
    created_at: "2025-02-20T09:00:00Z",
  },
  {
    id: "entry-4",
    title: "Grandpa's Garden Notes",
    type: "lesson",
    created_at: "2025-02-15T16:45:00Z",
  },
  {
    id: "entry-5",
    title: "Aunt Diane's Quilting Tradition",
    type: "skill",
    created_at: "2025-02-10T11:30:00Z",
  },
];

export default async function ProfilePage() {
  let user: ProfileUser = MOCK_USER;
  let recentEntries: RecentEntry[] = MOCK_RECENT_ENTRIES;
  let lifeStory: LifeStory | undefined;
  let memberId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      // Get the user's family member record (including life_story)
      const { data: membership } = await supabase
        .from("family_members")
        .select("id, family_id, display_name, role, avatar_url, joined_at, life_story")
        .eq("user_id", authUser.id)
        .single();

      if (membership) {
        // Count entries by this user
        const { count: entriesCount } = await supabase
          .from("entries")
          .select("id", { count: "exact", head: true })
          .eq("family_id", membership.family_id)
          .eq("author_id", authUser.id);

        // Count tutorials (tutorials belong to the family, no author_id on table,
        // but we count tutorials in the user's family)
        const { count: tutorialsCount } = await supabase
          .from("skill_tutorials")
          .select("id", { count: "exact", head: true })
          .eq("family_id", membership.family_id);

        // Get recent entries by this user (last 5)
        const { data: recentData } = await supabase
          .from("entries")
          .select("id, title, type, created_at")
          .eq("family_id", membership.family_id)
          .eq("author_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Get distinct entry types contributed by this user
        const { data: typesData } = await supabase
          .from("entries")
          .select("type")
          .eq("family_id", membership.family_id)
          .eq("author_id", authUser.id);

        const distinctTypes = typesData
          ? [...new Set(typesData.map((t) => t.type))]
          : [];

        user = {
          display_name: membership.display_name,
          email: authUser.email || "",
          role: membership.role,
          avatar_url: membership.avatar_url,
          joined_at: membership.joined_at,
          stats: {
            entries_created: entriesCount || 0,
            tutorials_created: tutorialsCount || 0,
            types_contributed: distinctTypes,
          },
        };

        if (recentData && recentData.length > 0) {
          recentEntries = recentData.map((e) => ({
            id: e.id,
            title: e.title,
            type: e.type,
            created_at: e.created_at,
          }));
        } else if (recentData && recentData.length === 0) {
          recentEntries = [];
        }

        // Extract life_story (normalize to ensure all fields exist) and member ID
        lifeStory = normalizeLifeStory(membership.life_story);
        memberId = membership.id;
      }
    }
  } catch (e) {
    console.error("Failed to fetch profile data, using mock:", e);
  }

  return (
    <ProfileClient
      user={user}
      recentEntries={recentEntries}
      lifeStory={lifeStory}
      memberId={memberId}
    />
  );
}
