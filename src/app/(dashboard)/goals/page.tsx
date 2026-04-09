import { redirect } from "next/navigation";
import { getFamilyContext } from "@/lib/get-family-context";
import { getGoals } from "./actions";
import GoalsClient from "./goals-client";

export default async function GoalsPage() {
  // Redirect to onboarding if user has no family
  const ctx = await getFamilyContext();
  if (!ctx) {
    redirect("/onboarding");
  }

  const goals = await getGoals();
  return <GoalsClient initialGoals={goals} />;
}
