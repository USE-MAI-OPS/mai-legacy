import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  Users,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Living Knowledge Base",
    description:
      "Document stories, recipes, skills, life lessons, and family connections in one searchable place.",
  },
  {
    icon: MessageCircle,
    title: "The Griot",
    description:
      "Your family's AI brain. Ask it anything and get answers drawn from your collective wisdom.",
  },
  {
    icon: GraduationCap,
    title: "Skill Tutorials",
    description:
      "Turn family knowledge into step-by-step guides anyone can follow and learn from.",
  },
  {
    icon: Users,
    title: "Family Collaboration",
    description:
      "Invite family members to contribute. Everyone adds to the knowledge, everyone benefits.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="font-serif text-2xl font-bold text-primary">MAI Legacy</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 max-w-4xl mx-auto">
        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Your family&apos;s wisdom,
          <br />
          <span className="text-muted-foreground">preserved forever.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          MAI Legacy is the knowledge platform for families. Document your
          stories, skills, recipes, and lessons. Then ask the Griot — your
          family&apos;s AI — anything.
        </p>
        <div className="flex gap-4 mt-8">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Your Legacy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo">See Demo</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-none bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-primary text-primary-foreground rounded-2xl p-12 shadow-md">
          <h2 className="font-serif text-3xl font-bold">
            Every family has a story worth keeping.
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Start documenting your family&apos;s legacy today. Free to start,
            no credit card required.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6"
            asChild
          >
            <Link href="/signup">Create Your Family</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-muted-foreground border-t">
        <p>&copy; 2026 MAI Legacy. Built for families, by families.</p>
      </footer>
    </div>
  );
}
