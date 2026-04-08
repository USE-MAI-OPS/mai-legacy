"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { Check, Loader2 } from "lucide-react";

const TIERS = [
  {
    key: "free" as const,
    name: "Free",
    tagline: "For getting started",
    price: "Free",
    period: "",
    features: [
      "Up to 25 legacy entries",
      "3 family members",
      "1 GB storage",
      "50 Griot messages/month",
      "Basic family tree",
    ],
    cta: "Get Started Free",
    href: "/signup",
    popular: false,
  },
  {
    key: "roots" as const,
    name: "Roots",
    tagline: "For growing families",
    price: "$9",
    period: "/month",
    features: [
      "Unlimited members",
      "Unlimited entries",
      "Full Griot AI access",
      "Legacy Book PDF export",
      "Family tree unlimited",
      "Priority support",
      "Interview import",
    ],
    cta: "Start with Roots",
    popular: true,
  },
  {
    key: "legacy" as const,
    name: "Legacy",
    tagline: "For families who want it all",
    price: "$19",
    period: "/month",
    features: [
      "Everything in Roots plus:",
      "Custom branding",
      "Multiple family groups",
      "API access",
      "Dedicated support",
      "Bulk data export",
    ],
    cta: "Choose Legacy",
    popular: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(tier: "roots" | "legacy") {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        if (res.status === 401) {
          window.location.href = "/signup";
        }
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple pricing for every family
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Start free, grow as your family&apos;s legacy grows. Preserve your
            stories, photos, and traditions in a digital sanctuary built for
            generations.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all ${
                tier.popular
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : "shadow-sm hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-4 shadow-sm bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              {/* Header */}
              <div className="mb-4">
                <h3 className="font-serif text-xl font-bold">
                  {tier.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tier.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-muted-foreground text-sm">
                    {tier.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2.5 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.key === "free" ? (
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  asChild
                >
                  <Link href={tier.href!}>{tier.cta}</Link>
                </Button>
              ) : (
                <Button
                  className={`w-full rounded-full ${
                    tier.popular ? "shadow-md" : ""
                  }`}
                  onClick={() => handleSubscribe(tier.key as "roots" | "legacy")}
                  disabled={loading !== null}
                >
                  {loading === tier.key ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {tier.cta}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/50 py-10 px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center font-semibold mb-6">
          Trusted by families worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground/60">
          {["GenealogyToday", "StoryKeepers", "HeritageVault", "RootedLegacy"].map(
            (name) => (
              <span
                key={name}
                className="text-sm font-semibold tracking-wide"
              >
                {name}
              </span>
            )
          )}
        </div>
      </section>

      {/* Mini footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-serif font-bold text-sm text-foreground">
            MAI Legacy
          </span>
          <p>&copy; {new Date().getFullYear()} MAI Legacy. Preserving heritage for generations.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
