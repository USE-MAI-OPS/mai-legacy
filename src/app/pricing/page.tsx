"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, TreeDeciduous, Loader2 } from "lucide-react";

const TIERS = [
  {
    key: "seedling" as const,
    name: "Seedling",
    price: "Free",
    period: "",
    description: "Start preserving your family's legacy",
    features: [
      "Up to 25 legacy entries",
      "3 family members",
      "1 GB storage",
      "50 Griot messages/month",
      "Basic family tree",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    key: "roots" as const,
    name: "Roots",
    price: "$9",
    period: "/mo",
    description: "Grow your family's story together",
    features: [
      "Up to 500 legacy entries",
      "15 family members",
      "10 GB storage",
      "500 Griot messages/month",
      "Advanced family tree",
      "Interview imports",
      "Shared traditions & events",
    ],
    cta: "Subscribe",
    popular: true,
  },
  {
    key: "legacy" as const,
    name: "Legacy",
    price: "$19",
    period: "/mo",
    description: "The complete family legacy experience",
    features: [
      "Unlimited legacy entries",
      "Unlimited family members",
      "100 GB storage",
      "Unlimited Griot messages",
      "Advanced family tree",
      "Interview imports",
      "Shared traditions & events",
      "Priority support",
      "Custom family branding",
    ],
    cta: "Subscribe",
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
        // If not authenticated, redirect to signup
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <TreeDeciduous className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold text-foreground">
              MAI Legacy
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Preserve what matters most
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Choose the plan that fits your family. Start free, upgrade when you
          need more space for your stories.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {TIERS.map((tier) => (
            <Card
              key={tier.key}
              className={`relative flex flex-col ${
                tier.popular
                  ? "border-primary shadow-lg ring-1 ring-primary/20"
                  : ""
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="font-serif text-2xl">
                  {tier.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-muted-foreground">{tier.period}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {tier.key === "seedling" ? (
                    <Link href={tier.href!} className="block">
                      <Button variant="outline" className="w-full">
                        {tier.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(tier.key)}
                      disabled={loading !== null}
                    >
                      {loading === tier.key ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {tier.cta}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
