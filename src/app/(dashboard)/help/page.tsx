import {
  HelpCircle,
  Mail,
  Users,
  FileText,
  Target,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpFaqSection } from "./help-faq-section";

const faqs = [
  {
    question: "What is MAI Legacy?",
    answer:
      "MAI Legacy is a family knowledge platform that helps you document and preserve your family's stories, recipes, skills, lessons, and connections. Think of it as a living archive powered by AI that your whole family can contribute to.",
  },
  {
    question: "What is Griot?",
    answer:
      "Griot is your family's AI-powered storyteller. It draws from all the memories your family has created to answer questions, surface connections, and help you explore your family's collective knowledge through conversation.",
  },
  {
    question: "How do I invite family members?",
    answer:
      'Go to the Family page, click "Invite Member," and enter their email address. They\'ll receive a magic link to join your family space — no password needed.',
  },
  {
    question: "What types of memories can I create?",
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
      "When you create an entry, it's automatically processed and embedded into your family's knowledge base. Griot uses this to provide contextual, personalized answers drawn from your family's actual stories and knowledge.",
  },
];

const featureGuides = [
  {
    icon: FileText,
    title: "Creating Memories",
    description:
      "Document your family's stories, recipes, skills, and lessons. Each memory is searchable and feeds into Griot's knowledge.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Users,
    title: "Managing Your Family",
    description:
      "Invite members, view the family tree, and explore upcoming events. Admins can manage members from the Family Settings page.",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    icon: Sparkles,
    title: "Using Griot",
    description:
      'Ask questions about your family\'s knowledge. Try prompts like "What recipes has Grandma shared?" or "Tell me about our family traditions."',
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Target,
    title: "Your Profile & Life Story",
    description:
      "Build your personal life story with career history, education, milestones, and more. This enriches Griot's understanding of your family.",
    iconColor: "text-green-600",
    iconBg: "bg-green-100 dark:bg-green-900/30",
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

      <HelpFaqSection faqs={faqs} />

      {/* Getting Started */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Getting Started
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureGuides.map((guide) => (
            <Card key={guide.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${guide.iconBg}`}>
                    <guide.icon className={`size-4 ${guide.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{guide.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Need More Help */}
      <section className="mb-10">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-[#C17B54]/10 flex items-center justify-center mx-auto">
                <Mail className="h-5 w-5 text-[#C17B54]" />
              </div>
              <h3 className="text-lg font-semibold text-center mt-4">Still have questions?</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">Our support team is here to help you preserve your heritage.</p>
              <a
                href="mailto:support@usemai.com"
                className="text-[#C17B54] font-medium mt-3 hover:underline"
              >
                support@usemai.com
              </a>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4">WE TYPICALLY RESPOND WITHIN 24 HOURS</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Popular Tutorials */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Popular Tutorials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl overflow-hidden h-32 relative bg-gradient-to-br from-amber-600 to-orange-700">
            <div className="absolute top-3 left-3">
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">NEW</span>
            </div>
            <p className="absolute bottom-3 left-3 text-sm font-bold text-white">Preserving Heirloom Stories</p>
          </div>
          <div className="rounded-xl overflow-hidden h-32 relative bg-gradient-to-br from-stone-600 to-stone-800">
            <p className="absolute bottom-3 left-3 text-sm font-bold text-white">The Art of Oral History</p>
          </div>
          <div className="rounded-xl overflow-hidden h-32 relative bg-gradient-to-br from-emerald-600 to-green-800">
            <p className="absolute bottom-3 left-3 text-sm font-bold text-white">Mastering Family Trees</p>
          </div>
        </div>
      </section>
    </div>
  );
}
