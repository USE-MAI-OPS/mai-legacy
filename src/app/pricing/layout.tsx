import type { ReactNode } from "react";

export const metadata = {
  title: "Pricing",
  description:
    "Simple pricing for every family. Start free or upgrade to Roots or Legacy.",
  openGraph: {
    title: "Pricing | MAI Legacy",
    description:
      "Simple pricing for every family. Start free or upgrade to Roots or Legacy.",
    url: "/pricing",
  },
  twitter: {
    title: "Pricing | MAI Legacy",
    description:
      "Simple pricing for every family. Start free or upgrade to Roots or Legacy.",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
