import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  Lightbulb,
  Users,
  FileText,
  Target,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const faqs = [
  {
    question: "What is MAI Legacy?",
    answer:
      "MAI Legacy is a family knowledge platform that helps you document and preserve your family's stories, recipes, skills, lessons, and connections. Think of it as a living archive powered by AI that your whole family can contribute to.",
  },
  {
    question: "What is The Griot?",
    answer:
      "The Griot is your family's AI-powered storyteller. It draws from all the entries your family has created to answer questions, surface connections, and help you explore your family's collective knowledge through conversation.",
  },
  {
    question: "How do I invite family members?",
    answer:
      'Go to the Family page, click "Invite Member," and enter their email address. They\'ll receive a magic link to join your family space — no password needed.',
  },
  {
    question: "What types of entries can I create?",
    answer:
      "You can create Stories (personal narratives), Recipes (family dishes), Skills (how-to knowledge), Lessons (wisdom and advice), and Connections (relationships and memories about people).",
  },
  {
    question: "Can I belong to multiple families?",
    answer:
      "Yes! You can create or join multiple family spaces. Use the family switcher in the bottom-left of the sidebar to switch between them.",
  },
  {
    question: "How does the AI understand my family?",
    answer:
      "When you create an entry, it's automatically processed and embedded into your family's knowledge base. The Griot uses this to provide contextual, personalized answers drawn from your family's actual stories and knowledge.",
  },
];

const featureGuides = [
  {
    icon: FileText,
    title: "Creating Entries",
    description:
      "Document your family's stories, recipes, skills, and lessons. Each entry is searchable and feeds into The Griot's knowledge.",
  },
  {
    icon: MessageCircle,
    title: "Using The Griot",
    description:
      'Ask questions about your family\'s knowledge. Try prompts like "What recipes has Grandma shared?" or "Tell me about our family traditions."',
  },
  {
    icon: Users,
    title: "Managing Your Family",
    description:
      "Invite members, view the family tree, and explore upcoming events. Admins can manage members from the Family Settings page.",
  },
  {
    icon: Target,
    title: "Setting Goals",
    description:
      "Track family goals and milestones. Create shared objectives that everyone can contribute to and celebrate together.",
  },
  {
    icon: Sparkles,
    title: "Your Profile & Life Story",
    description:
      "Build your personal life story with career history, education, milestones, and more. This enriches The Griot's understanding of your family.",
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <HelpCircle className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground">
            Learn how to get the most out of MAI Legacy
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Getting Started */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" />
          Getting Started
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {featureGuides.map((guide) => (
                <div
                  key={guide.title}
                  className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <guide.icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{guide.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          Frequently Asked Questions
        </h2>
        <Card>
          <CardContent className="pt-2 pb-0">
            <Accordion type="single" collapsible>
              {faqs.map((faq, i) => (
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
          </CardContent>
        </Card>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          Contact Us
        </h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Have a question that&apos;s not answered here? We&apos;d love to
              hear from you.
            </p>
            <a
              href="mailto:support@mailegacy.com"
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="size-4" />
              support@mailegacy.com
            </a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
