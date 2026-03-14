import { redirect } from "next/navigation";

/** Families are no longer separate — the connection chain handles visibility.
 *  Redirect any old links to the dashboard. */
export default function AddFamilyPage() {
  redirect("/dashboard");
}
