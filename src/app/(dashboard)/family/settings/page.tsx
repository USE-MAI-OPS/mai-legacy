import { createClient } from "@/lib/supabase/server";
import { FamilySettingsClient } from "./family-settings-client";

// Mock data fallback
interface MemberData {
  id: string;
  name: string;
  email: string | null;
  initials: string;
  role: string;
  joined: string;
}

interface InviteData {
  email: string;
  sentAt: string;
  role: string;
}

const MOCK_FAMILY_ID = "mock-family-id";
const MOCK_FAMILY_NAME = "The Powell Family";
const MOCK_MEMBERS: MemberData[] = [
  {
    id: "1",
    name: "Kobe Powell",
    email: "kobe@example.com",
    initials: "KP",
    role: "admin",
    joined: "Jan 15, 2026",
  },
  {
    id: "2",
    name: "Auntie Mae",
    email: "mae@example.com",
    initials: "AM",
    role: "member",
    joined: "Jan 16, 2026",
  },
  {
    id: "3",
    name: "Marcus Jr.",
    email: "marcus@example.com",
    initials: "MJ",
    role: "member",
    joined: "Jan 18, 2026",
  },
  {
    id: "4",
    name: "Ray Powell",
    email: "ray@example.com",
    initials: "RP",
    role: "member",
    joined: "Feb 1, 2026",
  },
  {
    id: "5",
    name: "Lisa Powell",
    email: "lisa@example.com",
    initials: "LP",
    role: "member",
    joined: "Feb 10, 2026",
  },
];
const MOCK_PENDING_INVITES: InviteData[] = [
  { email: "cousin.james@example.com", sentAt: "2 days ago", role: "member" },
];

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

export default async function FamilySettingsPage() {
  let familyId = MOCK_FAMILY_ID;
  let familyName = MOCK_FAMILY_NAME;
  let members = MOCK_MEMBERS;
  let pendingInvites = MOCK_PENDING_INVITES;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Get the user's family membership
      const { data: membership } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();

      if (membership) {
        familyId = membership.family_id;

        // Fetch family name
        const { data: family } = await supabase
          .from("families")
          .select("name")
          .eq("id", familyId)
          .single();

        if (family) {
          familyName = family.name;
        }

        // Fetch members
        const { data: membersData } = await supabase
          .from("family_members")
          .select("id, user_id, display_name, role, joined_at")
          .eq("family_id", familyId)
          .order("joined_at", { ascending: true });

        if (membersData && membersData.length > 0) {
          members = membersData.map((m) => ({
            id: m.id,
            name: m.display_name,
            email: null,
            initials: getInitials(m.display_name),
            role: m.role,
            joined: formatDate(m.joined_at),
          }));
        }

        // Fetch pending invites
        const { data: invitesData } = await supabase
          .from("family_invites")
          .select("email, role, created_at")
          .eq("family_id", familyId)
          .eq("accepted", false)
          .order("created_at", { ascending: false });

        if (invitesData) {
          pendingInvites = invitesData.map((inv) => ({
            email: inv.email,
            sentAt: timeAgo(inv.created_at),
            role: inv.role,
          }));
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch family settings, using mock data:", e);
  }

  return (
    <FamilySettingsClient
      familyId={familyId}
      initialFamilyName={familyName}
      members={members}
      pendingInvites={pendingInvites}
    />
  );
}
