"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Question categories from the Family Interview Questions Guide
// ---------------------------------------------------------------------------
interface QuestionCategory {
  id: string;
  title: string;
  description: string;
  entryType: string;
  questions: string[];
}

const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: "warmup",
    title: "Getting Started",
    description: "Warm-up questions to ease into the conversation",
    entryType: "Profile",
    questions: [
      "What do people in the family call you? Any nicknames? Where did they come from?",
      "Where were you born, and what do you remember about growing up there?",
      "What was your house like? Your neighborhood?",
      "Who were the important people in your childhood — family, neighbors, friends?",
      "What did your parents do for work? What were they like as people?",
    ],
  },
  {
    id: "stories",
    title: "Stories & Memories",
    description: "Capture narrative moments and turning points",
    entryType: "Story",
    questions: [
      "What's your earliest memory?",
      "What's a story from your childhood that you've told more than once? Why does it stick with you?",
      "Was there a moment in your life where everything changed — a turning point?",
      "What's the funniest thing that ever happened in this family?",
      "Tell me about a hard time you went through. How did you get through it?",
      "What's something that happened to you that people wouldn't believe?",
      "What was your wedding day like? How did you and your partner meet?",
      "What's a story about a specific family member that you think everyone should know?",
    ],
  },
  {
    id: "recipes",
    title: "Recipes & Food",
    description: "Preserve family recipes and food traditions",
    entryType: "Recipe",
    questions: [
      "What's a dish you're known for? How did you learn to make it?",
      "Who taught you to cook? What was the kitchen like growing up?",
      "Is there a recipe in the family that would be a tragedy to lose? Can you walk me through how you make it?",
      "What did a typical Sunday dinner look like when you were growing up?",
      "Are there foods you associate with specific people or holidays?",
      "Do you measure anything, or is it all 'a little of this, a little of that'?",
      "What's a meal you wish you could eat one more time?",
    ],
  },
  {
    id: "skills",
    title: "Skills & How-To",
    description: "Document practical knowledge and techniques",
    entryType: "Skill",
    questions: [
      "What's something you know how to do that you think younger people should learn?",
      "Can you walk me through how you do it? Like, step by step?",
      "Who taught you that? How old were you?",
      "What tools or materials do you need? Any tricks that make it easier?",
      "Is there a skill you wish someone had taught you?",
      "What do you think is the most underrated skill a person can have?",
    ],
  },
  {
    id: "lessons",
    title: "Life Lessons & Wisdom",
    description: "Capture advice, values, and hard-won insights",
    entryType: "Lesson",
    questions: [
      "What's the best advice you ever got? Who gave it to you?",
      "What's something you learned the hard way?",
      "If you could tell your younger self one thing, what would it be?",
      "What do you think is the most important thing for a family to get right?",
      "What's a mistake you made that ended up being a blessing?",
      "What do you wish people understood about your generation?",
      "What values did your parents pass down to you? Which ones did you keep?",
      "What does it mean to you to live a good life?",
    ],
  },
  {
    id: "connections",
    title: "Family Connections",
    description: "Map relationships and uncover family history",
    entryType: "Connection",
    questions: [
      "Can you help me map out the family tree? Who are people we've lost touch with?",
      "Tell me about your siblings. What were they like growing up?",
      "Who in the family are you closest to? Why?",
      "Are there family members I should know about that I've never met?",
      "Who was the character of the family — the one everyone has a story about?",
      "Is there anyone in the family you wish you'd gotten to know better?",
    ],
  },
  {
    id: "traditions",
    title: "Traditions & Culture",
    description: "Preserve cultural practices and family customs",
    entryType: "Tradition",
    questions: [
      "What traditions did your family have that we still do today? Any we've lost?",
      "What holidays were the biggest deal growing up? What made them special?",
      "Were there any superstitions or sayings in the family? Where did they come from?",
      "What music, songs, or hymns are part of our family's story?",
      "Is there a place — a house, a church, a town — that means something to the whole family?",
    ],
  },
  {
    id: "career",
    title: "Career & Education",
    description: "Document professional journey and milestones",
    entryType: "Profile",
    questions: [
      "What was your first job? How old were you?",
      "What's the job you're most proud of? Why?",
      "Did you go to school? What was that experience like?",
      "Was there a teacher, mentor, or boss who really shaped you?",
      "If you could have done any job in the world, what would it have been?",
    ],
  },
  {
    id: "forward",
    title: "Looking Forward",
    description: "Close the session with reflective wisdom",
    entryType: "Lesson",
    questions: [
      "What do you hope this family is known for?",
      "What are you most proud of when you look at this family?",
      "Is there anything you've never told anyone that you want on the record?",
      "What do you want your grandchildren to know about you?",
      "If someone listens to this recording in 50 years, what do you want them to hear?",
    ],
  },
];

const FOLLOW_UP_PROMPTS = [
  "Tell me more about that.",
  "What happened next?",
  "How did that make you feel?",
  "Who else was there?",
  "Do you remember what year that was?",
  "Would you say that changed you?",
  "Is there a part of that story people don't usually hear?",
];

const TIPS = [
  "Let them talk. These are starting points, not a checklist.",
  "Record everything. The best stuff comes from tangents.",
  'Ask "tell me more" often. It\'s the most powerful question.',
  "Bring props. Old photos or objects unlock memories.",
  "Go back for seconds. One session won't cover everything.",
];

const entryTypeColors: Record<string, string> = {
  Story: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Recipe: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Skill: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Lesson: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Connection: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  Profile: "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300",
  Tradition: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function InterviewGuide() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["warmup"])
  );

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedCategories(
      new Set(QUESTION_CATEGORIES.map((c) => c.id))
    );
  }

  function collapseAll() {
    setExpandedCategories(new Set());
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="size-4" />
          Interview Guide
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Interview Questions Guide
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Use these questions when interviewing family members. Record the
            conversation, then paste the transcript to extract entries.
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 py-4 space-y-5">
            {/* Tips section */}
            <div className="rounded-lg border bg-primary/5 p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" />
                Tips Before You Start
              </h3>
              <ul className="space-y-1.5">
                {TIPS.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-medium shrink-0">
                      {i + 1}.
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Expand/Collapse controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Question Categories
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={expandAll}
                >
                  Expand All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={collapseAll}
                >
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Categories */}
            {QUESTION_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              return (
                <div
                  key={category.id}
                  className="rounded-lg border overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-medium">
                          {category.title}
                        </span>
                        <p className="text-xs text-muted-foreground truncate">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ml-2 ${
                        entryTypeColors[category.entryType] ?? ""
                      }`}
                    >
                      {category.entryType}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 pb-3 pt-2 space-y-2">
                      {category.questions.map((question, qi) => (
                        <div
                          key={qi}
                          className="flex gap-2.5 text-sm py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-muted-foreground font-medium shrink-0 w-5 text-right">
                            {qi + 1}.
                          </span>
                          <span className="text-foreground">{question}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Follow-up prompts */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h3 className="text-sm font-semibold">
                Follow-Up Prompts
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Use these anytime to keep the conversation flowing:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FOLLOW_UP_PROMPTS.map((prompt, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs font-normal py-1"
                  >
                    &ldquo;{prompt}&rdquo;
                  </Badge>
                ))}
              </div>
            </div>

            {/* After recording section */}
            <div className="rounded-lg border p-4 space-y-2 mb-4">
              <h3 className="text-sm font-semibold">After the Recording</h3>
              <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                <li>Transcribe the conversation (voice memo to text)</li>
                <li>
                  Paste the transcript into the input box on this page
                </li>
                <li>
                  We&apos;ll extract stories, recipes, lessons, skills, and
                  connections automatically
                </li>
                <li>Review and save the entries to your family&apos;s knowledge base</li>
              </ol>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
