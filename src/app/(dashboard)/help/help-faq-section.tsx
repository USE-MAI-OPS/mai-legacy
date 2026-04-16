"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Faq {
  question: string;
  answer: string;
}

interface HelpFaqSectionProps {
  faqs: Faq[];
}

export function HelpFaqSection({ faqs }: HelpFaqSectionProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q),
    );
  }, [faqs, query]);

  return (
    <>
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#C17B54]/10 to-amber-50 dark:from-[#C17B54]/5 dark:to-amber-950/20 rounded-xl p-8 mb-8 mt-6">
        <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
          How can we help you today?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search our guides, FAQs, and tutorials to find answers.
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help..."
            className="rounded-full border bg-background pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search help topics"
          />
        </div>
      </div>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          Frequently Asked Questions
        </h2>
        <Card>
          <CardContent className="pt-2 pb-0">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;. Try a different search.
              </p>
            ) : (
              <Accordion type="single" collapsible>
                {filtered.map((faq, i) => (
                  <AccordionItem key={faq.question} value={`faq-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
