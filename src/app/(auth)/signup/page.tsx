import { SignupFlow } from "./signup-flow";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;

  return <SignupFlow redirectTo={redirectTo} />;
}
