import { redirect } from "next/navigation";

/** Families are no longer separate — the connection chain handles visibility.
 *  Redirect any old links to the feed. */
export default function AddFamilyPage() {
  redirect("/feed");
}
