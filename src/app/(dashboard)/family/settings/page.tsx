import { redirect } from "next/navigation";
import { getFamilyContext } from "@/lib/get-family-context";
import { FamilySettingsClient } from "./family-settings-client";
import type { PlanTier, SubscriptionStatus } from "@/types/database";

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
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }

  const { supabase, familyId, userId } = ctx;

  // Fetch family name + billing info
  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("name, plan_tier, subscription_status")
    .eq("id", familyId)
    .single();

  if (familyError || !family) {
    console.error("Failed to load family record for settings page:", familyError);
    redirect("/onboarding");
  }

  // Check if current user is admin
  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();
  const isAdmin = membership?.role === "admin";

  // Fetch members
  const { data: membersData } = await supabase
    .from("family_members")
    .select("id, user_id, display_name, role, joined_at")
    .eq("family_id", familyId)
    .order("joined_at", { ascending: true });

  const members: MemberData[] = (membersData ?? []).map((m) => ({
    id: m.id,
    name: m.display_name,
    email: null,
    initials: getInitials(m.display_name),
    role: m.role,
    joined: formatDate(m.joined_at),
  }));

  // Fetch pending invites
  const { data: invitesData } = await supabase
    .from("family_invites")
    .select("email, role, created_at")
    .eq("family_id", familyId)
    .eq("accepted", false)
    .order("created_at", { ascending: false });

  const pendingInvites: InviteData[] = (invitesData ?? []).map((inv) => ({
    email: inv.email,
    sentAt: timeAgo(inv.created_at),
    role: inv.role,
  }));

  const planTier: PlanTier = family.plan_tier;
  const subscriptionStatus: SubscriptionStatus = family.subscription_status;

  return (
    <FamilySettingsClient
      familyId={familyId}
      initialFamilyName={family.name}
      members={members}
      pendingInvites={pendingInvites}
      planTier={planTier}
      subscriptionStatus={subscriptionStatus}
      isAdmin={isAdmin}
    />
  );
}
