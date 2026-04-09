import { redirect } from "next/navigation";
import { getFamilyContext } from "@/lib/get-family-context";
import { InviteClient } from "./invite-client";

export default async function InviteMembersPage() {
  const ctx = await getFamilyContext();
  if (!ctx) redirect("/onboarding");

  const { supabase, familyId } = ctx;

  // Fetch family name
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", familyId)
    .single();

  return (
    <InviteClient
      familyId={familyId}
      familyName={family?.name ?? "Your Family"}
    />
  );
}
