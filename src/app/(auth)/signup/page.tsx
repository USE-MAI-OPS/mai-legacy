import { SignupFlow } from "./signup-flow";

export const metadata = {
  title: "Sign Up",
  description: "Create your MAI Legacy account and start preserving your family's story.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;

  return <SignupFlow redirectTo={redirectTo} />;
}
