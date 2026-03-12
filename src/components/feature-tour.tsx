"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  MessageCircle,
  Users,
  UserCircle,
  TreePine,
  ChefHat,
  Wrench,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Tour step data
// ---------------------------------------------------------------------------
interface TourStep {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: Sparkles,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Welcome to MAI Legacy!",
    description:
      "Your family's digital knowledge base. Preserve stories, recipes, skills, and wisdom for generations to come.",
    tip: "Let's take a quick tour of the features available to you.",
  },
  {
    icon: BookOpen,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Create Entries",
    description:
      "Document family knowledge as entries — stories, recipes, skills, lessons, and connections. Each type has its own guided form to help you capture the details.",
    tip: "Navigate to Entries in the sidebar and click \"New Entry\" to get started.",
  },
  {
    icon: MessageCircle,
    iconColor: "text-green-600",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    title: "Ask The Griot",
    description:
      "The Griot is your family's AI assistant. It searches through all your entries to answer questions about your family's knowledge — like a wise elder with perfect memory.",
    tip: "Try asking \"What recipes do we have?\" or \"Tell me about Grandma's stories.\"",
  },
  {
    icon: TreePine,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Family Tree",
    description:
      "Build your family tree by adding members — even people who haven't signed up yet. Connect parents, children, and spouses to visualize your family's structure.",
    tip: "Go to the Family page and click \"Add Member\" to start building your tree.",
  },
  {
    icon: CalendarDays,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    title: "Family Events",
    description:
      "Plan family gatherings, reunions, and celebrations. Create events with dates and locations, and family members can RSVP to stay coordinated.",
    tip: "Check the Family page for upcoming events or create a new one.",
  },
  {
    icon: ChefHat,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    title: "Recipes, Skills & Lessons",
    description:
      "Each entry type has structured forms. Recipes include ingredients and instructions. Skills have step-by-step tutorials. Lessons capture wisdom with context.",
    tip: "Use the search on the Family page's feature cards to quickly find entries by type.",
  },
  {
    icon: Users,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-100 dark:bg-pink-900/30",
    title: "Invite Family Members",
    description:
      "Grow your family's knowledge base by inviting others. Send email invites from Family Settings, and they'll join your family with their own profile.",
    tip: "Go to Family → Settings → Invite to send magic link invitations.",
  },
  {
    icon: UserCircle,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    title: "Your Profile & Life Story",
    description:
      "Your profile is your life resume — career history, places lived, education, skills, hobbies, and milestones. Upload a profile picture and share your story.",
    tip: "Click your name in the sidebar to view and edit your profile.",
  },
];

// ---------------------------------------------------------------------------
// Feature Tour Component
// ---------------------------------------------------------------------------
const TOUR_STORAGE_KEY = "mai-legacy-tour-completed";

export function FeatureTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already completed the tour
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Tour Card */}
      <div className="relative w-full max-w-md mx-4 bg-card rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Close tour"
        >
          <X className="size-4 text-muted-foreground" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1 px-6 pt-5">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "bg-primary flex-[2]"
                  : i < currentStep
                  ? "bg-primary/40 flex-1"
                  : "bg-muted flex-1"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-2">
          {/* Icon */}
          <div
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg} mb-4`}
          >
            <StepIcon className={`size-7 ${step.iconColor}`} />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold tracking-tight mb-2">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {step.description}
          </p>

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary/80 leading-relaxed">
              {step.tip}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {currentStep + 1} of {TOUR_STEPS.length}
          </div>
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1 h-8"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </Button>
            )}
            {isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 text-muted-foreground"
              >
                Skip Tour
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1 h-8"
            >
              {isLast ? (
                "Get Started!"
              ) : (
                <>
                  Next
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Button that allows users to re-launch the tour from settings/help.
 */
export function RelaunchTourButton() {
  const handleRelaunch = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRelaunch} className="gap-1.5">
      <Sparkles className="size-3.5" />
      Replay Feature Tour
    </Button>
  );
}
