import { getFamilyContext } from "@/lib/get-family-context";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  let email = "";
  let provider = "email";
  let createdAt = "";

  try {
    const ctx = await getFamilyContext();

    if (ctx) {
      const { supabase } = ctx;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        email = user.email ?? "";
        createdAt = user.created_at ?? "";

        // Detect auth provider
        if (user.app_metadata?.provider) {
          provider = user.app_metadata.provider;
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch settings data:", e);
  }

  return (
    <SettingsClient
      email={email}
      provider={provider}
      createdAt={createdAt}
    />
  );
}
