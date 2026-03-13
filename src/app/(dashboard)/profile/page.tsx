import { getFamilyContext } from "@/lib/get-family-context";
import {
  ProfileClient,
  type ProfileUser,
  type RecentEntry,
} from "./profile-client";
import { normalizeLifeStory } from "@/types/database";
import type { LifeStory } from "@/types/database";

const FALLBACK_USER: ProfileUser = {
  display_name: "User",
  email: "",
  role: "member",
  avatar_url: null,
  joined_at: new Date().toISOString(),
  stats: {
    entries_created: 0,
    types_contributed: [],
  },
};

export default async function ProfilePage() {
  let user: ProfileUser = FALLBACK_USER;
  let recentEntries: RecentEntry[] = [];
  let lifeStory: LifeStory | undefined;
  let memberId: string | undefined;
  let currentUserId: string | undefined;

  try {
    const ctx = await getFamilyContext();

    if (ctx) {
      const { userId, familyId, supabase } = ctx;
      // Get auth email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      // Get the user's family member record (including life_story)
      const { data: membership } = await supabase
        .from("family_members")
        .select("id, family_id, display_name, role, avatar_url, joined_at, life_story")
        .eq("user_id", userId)
        .eq("family_id", familyId)
        .single();

      if (membership) {
        // Count entries by this user
        const { count: entriesCount } = await supabase
          .from("entries")
          .select("id", { count: "exact", head: true })
          .eq("family_id", familyId)
          .eq("author_id", userId);

        // Get recent entries by this user (last 5)
        const { data: recentData } = await supabase
          .from("entries")
          .select("id, title, type, created_at")
          .eq("family_id", familyId)
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        // Get distinct entry types contributed by this user
        const { data: typesData } = await supabase
          .from("entries")
          .select("type")
          .eq("family_id", familyId)
          .eq("author_id", userId);

        const distinctTypes = typesData
          ? [...new Set(typesData.map((t) => t.type))]
          : [];

        user = {
          display_name: membership.display_name,
          email: authUser?.email || "",
          role: membership.role,
          avatar_url: membership.avatar_url,
          joined_at: membership.joined_at,
          stats: {
            entries_created: entriesCount || 0,
            types_contributed: distinctTypes,
          },
        };

        recentEntries = (recentData ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          created_at: e.created_at,
        }));

        // Extract life_story (normalize to ensure all fields exist) and member ID
        lifeStory = normalizeLifeStory(membership.life_story);
        memberId = membership.id;
        currentUserId = userId;
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
      userId={currentUserId}
    />
  );
}
