import { getGoals } from "./actions";
import GoalsClient from "./goals-client";

export default async function GoalsPage() {
  const goals = await getGoals();
  return <GoalsClient initialGoals={goals} />;
}
