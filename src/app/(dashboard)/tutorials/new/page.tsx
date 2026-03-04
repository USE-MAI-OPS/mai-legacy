import { createClient } from "@/lib/supabase/server";
import { NewTutorialClient, type EntryOption } from "./new-tutorial-client";

const MOCK_ENTRIES: EntryOption[] = [
  { id: "entry-1", title: "Grandma Mae's Cornbread" },
  { id: "entry-2", title: "Family Reunion History" },
  { id: "entry-3", title: "Home Repair Skills" },
  { id: "entry-4", title: "Aunt Diane's Quilting" },
  { id: "entry-5", title: "Grandpa's Garden Notes" },
];

export default async function NewTutorialPage() {
  let entries: EntryOption[] = MOCK_ENTRIES;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Get user's family
      const { data: membership } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();

      if (membership) {
        const { data: entriesData } = await supabase
          .from("entries")
          .select("id, title")
          .eq("family_id", membership.family_id)
          .order("created_at", { ascending: false });

        if (entriesData && entriesData.length > 0) {
          entries = entriesData.map((e) => ({
            id: e.id,
            title: e.title,
          }));
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch entries, using mock data:", e);
  }

  return <NewTutorialClient entries={entries} />;
}
