import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { Check } from "lucide-react";

const TIERS = [
  {
    key: "mini",
    name: "MAI Bot Mini",
    tagline: "The car: start storing your private thought layer",
    price: "$10",
    period: "/month",
    storage: "10GB",
    features: [
      "10GB private thought/context storage",
      "Personal MAI Bot workspace",
      "Griot chat over your saved context",
      "Search across thoughts, entries, and memories",
      "Export or delete your data",
    ],
    cta: "Start with Mini",
    href: "/signup",
    popular: true,
  },
  {
    key: "ferrari",
    name: "MAI Bot Ferrari",
    tagline: "The Ferrari: serious capacity for operators and teams",
    price: "$1K",
    period: "/month",
    storage: "1TB",
    features: [
      "1TB / 1,000GB context storage",
      "Shared context spaces for families or teams",
      "Priority ingestion and advanced Griot access",
      "Bulk import and higher processing limits",
      "Priority support and onboarding",
    ],
    cta: "Talk to Sales",
    href: "/contact",
    popular: false,
  },
  {
    key: "fleet",
    name: "MAI Bot 10K / Fleet",
    tagline: "Business context infrastructure for high-volume teams",
    price: "$10K",
    period: "/month",
    storage: "10TB",
    features: [
      "10TB / 10,000GB business context tier",
      "Admin controls and dedicated onboarding",
      "Connector-ready architecture for approved systems",
      "Dedicated support and implementation planning",
      "Optional private infrastructure path as needs mature",
    ],
    cta: "Design a Business Pilot",
    href: "/contact",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Thought data pricing
          </Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Simple pricing for thoughts, context, and the agent that uses them.
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Other platforms charge for seats and files. MAI Bot prices around the
            private context you store: the memories, decisions, notes,
            motivations, relationships, and instructions Griot can reason over.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
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
                  Start Here
                </Badge>
              )}

              <div className="mb-4">
                <h3 className="font-serif text-xl font-bold">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tier.tagline}
                </p>
              </div>

              <div className="mb-3">
                <span className="text-4xl font-bold text-foreground">
                  {tier.price}
                </span>
                <span className="text-muted-foreground text-sm">
                  {tier.period}
                </span>
              </div>

              <div className="mb-6 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
                <p className="text-sm font-semibold text-primary">
                  {tier.storage} included storage
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Same product category. More capacity, processing, priority, and support as you move up.
                </p>
              </div>

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

              <Button
                variant={tier.popular ? "default" : "outline"}
                className={`w-full rounded-full ${
                  tier.popular ? "shadow-md" : ""
                }`}
                asChild
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-2xl border bg-muted/30 p-6 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-2">
            Implementation note
          </p>
          <p>
            The $1K and $10K tiers are sales-assisted pilots while MAI Bot rolls
            out storage metering, private asset infrastructure, and connector
            workflows. MAI Bot is the context layer; approved source systems and
            connector providers remain responsible for raw regulated records,
            passwords, and platform authentication.
          </p>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/50 py-10 px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center font-semibold mb-6">
          Built for private context, not ads
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground/70">
          {["Thoughts", "Context", "Memories", "Decisions", "Agent Access"].map(
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
            MAI Bot
          </span>
          <p>&copy; {new Date().getFullYear()} MAI Bot. Storing thoughts and context for what comes next.</p>
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
