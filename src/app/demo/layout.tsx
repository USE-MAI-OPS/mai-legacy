import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Demo",
  description:
    "Try MAI Legacy before you sign up. Walk through capturing a family story, recipe, or skill — and see how Griot AI helps you preserve it.",
  openGraph: {
    title: "Try MAI Legacy — Interactive Demo",
    description:
      "Walk through capturing a family story, recipe, or skill — and see how Griot AI helps you preserve it.",
    url: "/demo",
  },
  twitter: {
    title: "Try MAI Legacy — Interactive Demo",
    description:
      "Walk through capturing a family story, recipe, or skill — and see how Griot AI helps you preserve it.",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
