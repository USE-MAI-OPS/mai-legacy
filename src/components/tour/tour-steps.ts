import {
  Sparkles,
  BookOpen,
  MessageCircle,
  Users,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TourStep {
  id: string;
  /** data-tour-step attribute value to find the target element */
  target: string;
  /** Route to navigate to before showing this step */
  navigateTo?: string;
  /** Tooltip position relative to the target element */
  position: "bottom" | "right" | "left" | "top";
  /** Icon component */
  icon: LucideIcon;
  /** Tailwind color class for the icon */
  iconColor: string;
  /** Tailwind background class for the icon container */
  iconBg: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "dashboard-welcome",
    navigateTo: "/dashboard",
    position: "bottom",
    icon: Sparkles,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Welcome to MAI Legacy!",
    description:
      "This is your dashboard \u2014 a snapshot of your family's knowledge. Stats, recent entries, and goals all in one place.",
  },
  {
    id: "entries",
    target: "nav-entries",
    navigateTo: "/entries",
    position: "right",
    icon: BookOpen,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Create & Browse Entries",
    description:
      "Document family knowledge \u2014 stories, recipes, skills, and lessons. Each type has its own guided form.",
  },
  {
    id: "griot",
    target: "nav-griot",
    navigateTo: "/griot",
    position: "right",
    icon: MessageCircle,
    iconColor: "text-green-600",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    title: "Ask The Griot",
    description:
      "Your family's AI assistant. It searches all your entries to answer questions \u2014 like a wise elder with perfect memory.",
  },
  {
    id: "family",
    target: "nav-family",
    navigateTo: "/family",
    position: "right",
    icon: Users,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Your Family Hub",
    description:
      "Build your family tree, plan events, and invite members. Even people without accounts can be added.",
  },
  {
    id: "profile",
    target: "nav-profile",
    navigateTo: "/profile",
    position: "right",
    icon: User,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    title: "Your Profile & Life Story",
    description:
      "Your personal legacy \u2014 career, education, milestones. Upload a photo and tell your story.",
  },
];

export const TOUR_STORAGE_KEY = "mai-legacy-tour-completed";
