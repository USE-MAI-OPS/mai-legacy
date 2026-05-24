import type { ReactNode } from "react";

export const metadata = {
  title: "Pricing",
  description:
    "Pricing for thought and context data storage: $10 for 10GB, $1K for 1TB, and $10K for 10TB business context infrastructure.",
  openGraph: {
    title: "Pricing | MAI Bot",
    description:
      "Simple pricing for the private thought/context layer behind your AI agent.",
    url: "/pricing",
  },
  twitter: {
    title: "Pricing | MAI Bot",
    description:
      "Simple pricing for thought and context data: 10GB, 1TB, and 10TB tiers.",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
