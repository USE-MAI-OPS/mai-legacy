"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Wrench,
  Heart,
  Flag,
  Medal,
  Plus,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createFamily } from "../actions";
import type {
  LifeStory,
  CareerItem,
  PlaceItem,
  EducationItem,
  MilitaryInfo,
  MilestoneItem,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 7;

const EMPTY_LIFE_STORY: LifeStory = {
  career: [],
  places: [],
  education: [],
  skills: [],
  hobbies: [],
  military: null,
  milestones: [],
};

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < current
              ? "bg-primary"
              : i === current
              ? "bg-primary/40"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag input (for skills & hobbies)
// ---------------------------------------------------------------------------
function TagInput({
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (trimmed && !items.includes(trimmed)) {
      onAdd(trimmed);
      setValue("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="shrink-0"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 pl-2.5 pr-1.5 py-1"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline multi-field form row (for career, places, education, milestones)
// ---------------------------------------------------------------------------
function InlineFormRow({
  fields,
  onSubmit,
  onCancel,
}: {
  fields: { label: string; placeholder: string; width?: string }[];
  onSubmit: (values: string[]) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<string[]>(fields.map(() => ""));

  const handleSubmit = () => {
    if (values.every((v) => v.trim())) {
      onSubmit(values.map((v) => v.trim()));
      setValues(fields.map(() => ""));
    }
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
      <div className={`grid gap-2 grid-cols-1 ${fields.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {fields.map((field, i) => (
          <div key={field.label} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {field.label}
            </Label>
            <Input
              placeholder={field.placeholder}
              value={values[i]}
              onChange={(e) => {
                const newValues = [...values];
                newValues[i] = e.target.value;
                setValues(newValues);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="text-sm h-9"
              autoFocus={i === 0}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} className="h-8 text-xs gap-1">
          <Plus className="size-3" />
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main onboarding wizard
// ---------------------------------------------------------------------------
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [lifeStory, setLifeStory] = useState<LifeStory>(EMPTY_LIFE_STORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline form toggles
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showMilitaryForm, setShowMilitaryForm] = useState(false);

  const handleCreate = async () => {
    if (!familyName.trim() || !displayName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await createFamily(familyName, displayName, lifeStory);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // Success — navigate to dashboard
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 0) return familyName.trim().length > 0;
    if (step === 1) return displayName.trim().length > 0;
    return true; // All other steps are optional
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Step configs
  const stepInfo = [
    {
      icon: Users,
      title: "Name Your Family",
      description:
        "This is how your family will appear across MAI Legacy.",
    },
    {
      icon: User,
      title: "About You",
      description: "How should your family know you?",
    },
    {
      icon: MapPin,
      title: "Where You're From",
      description:
        "The places that shaped you. Add as many as you'd like, or skip for now.",
    },
    {
      icon: Briefcase,
      title: "Your Career & Education",
      description:
        "Share your professional journey and education. You can always add more later.",
    },
    {
      icon: Heart,
      title: "Skills & Interests",
      description:
        "What makes you, you? Add your skills, talents, and hobbies.",
    },
    {
      icon: Flag,
      title: "Life Milestones",
      description:
        "The moments that defined your journey — big or small.",
    },
    {
      icon: Sparkles,
      title: "You're All Set!",
      description: "Here's a summary of your profile. Ready to start your legacy?",
    },
  ];

  const StepIcon = stepInfo[step].icon;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-4">
          <div className="mb-4">
            <StepProgress current={step} total={TOTAL_STEPS} />
          </div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{stepInfo[step].title}</CardTitle>
          <CardDescription>{stepInfo[step].description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ---- STEP 0: Family Name ---- */}
          {step === 0 && (
            <div className="space-y-2">
              <Label htmlFor="family-name">Family Name</Label>
              <Input
                id="family-name"
                placeholder="e.g., The Powell Family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canGoNext() && goNext()}
                autoFocus
              />
            </div>
          )}

          {/* ---- STEP 1: Display Name ---- */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="display-name">Your Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="e.g., Kobe, Grandma Rose, Uncle Ray"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && canGoNext() && goNext()
                  }
                  autoFocus
                />
              </div>
              <div className="rounded-md border p-3 bg-muted/50">
                <p className="text-sm">
                  <span className="font-medium">{familyName}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    &middot; You&apos;ll be the admin
                  </span>
                </p>
              </div>
            </>
          )}

          {/* ---- STEP 2: Places Lived ---- */}
          {step === 2 && (
            <div className="space-y-3">
              {lifeStory.places.length > 0 && (
                <div className="space-y-1">
                  {lifeStory.places.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {p.city}, {p.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {p.years}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLifeStory((s) => ({
                              ...s,
                              places: s.places.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showPlaceForm ? (
                <InlineFormRow
                  fields={[
                    { label: "City", placeholder: "Atlanta" },
                    { label: "State", placeholder: "GA" },
                    { label: "Years", placeholder: "2020 - Present" },
                  ]}
                  onSubmit={([city, state, years]) => {
                    setLifeStory((s) => ({
                      ...s,
                      places: [...s.places, { city, state, years }],
                    }));
                    setShowPlaceForm(false);
                  }}
                  onCancel={() => setShowPlaceForm(false)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPlaceForm(true)}
                  className="gap-1.5 w-full"
                >
                  <Plus className="size-4" />
                  Add a Place
                </Button>
              )}
            </div>
          )}

          {/* ---- STEP 3: Career & Education ---- */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Career */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Briefcase className="size-3.5" />
                  Career History
                </Label>
                {lifeStory.career.length > 0 && (
                  <div className="space-y-1">
                    {lifeStory.career.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.company}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {c.years}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLifeStory((s) => ({
                                ...s,
                                career: s.career.filter(
                                  (_, idx) => idx !== i
                                ),
                              }))
                            }
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showCareerForm ? (
                  <InlineFormRow
                    fields={[
                      { label: "Title", placeholder: "Software Engineer" },
                      { label: "Company", placeholder: "Acme Corp" },
                      { label: "Years", placeholder: "2020 - Present" },
                    ]}
                    onSubmit={([title, company, years]) => {
                      setLifeStory((s) => ({
                        ...s,
                        career: [...s.career, { title, company, years }],
                      }));
                      setShowCareerForm(false);
                    }}
                    onCancel={() => setShowCareerForm(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCareerForm(true)}
                    className="gap-1.5 w-full"
                  >
                    <Plus className="size-4" />
                    Add Job
                  </Button>
                )}
              </div>

              <Separator />

              {/* Education */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <GraduationCap className="size-3.5" />
                  Education
                </Label>
                {lifeStory.education.length > 0 && (
                  <div className="space-y-1">
                    {lifeStory.education.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{e.school}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.degree}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {e.year}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLifeStory((s) => ({
                                ...s,
                                education: s.education.filter(
                                  (_, idx) => idx !== i
                                ),
                              }))
                            }
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showEduForm ? (
                  <InlineFormRow
                    fields={[
                      { label: "School", placeholder: "Georgia Tech" },
                      {
                        label: "Degree",
                        placeholder: "B.S. Computer Science",
                      },
                      { label: "Year", placeholder: "2016" },
                    ]}
                    onSubmit={([school, degree, year]) => {
                      setLifeStory((s) => ({
                        ...s,
                        education: [...s.education, { school, degree, year }],
                      }));
                      setShowEduForm(false);
                    }}
                    onCancel={() => setShowEduForm(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEduForm(true)}
                    className="gap-1.5 w-full"
                  >
                    <Plus className="size-4" />
                    Add Education
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ---- STEP 4: Skills & Interests ---- */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Wrench className="size-3.5" />
                  Skills & Talents
                </Label>
                <TagInput
                  items={lifeStory.skills}
                  onAdd={(s) =>
                    setLifeStory((prev) => ({
                      ...prev,
                      skills: [...prev.skills, s],
                    }))
                  }
                  onRemove={(i) =>
                    setLifeStory((prev) => ({
                      ...prev,
                      skills: prev.skills.filter((_, idx) => idx !== i),
                    }))
                  }
                  placeholder="e.g., Cooking, Woodworking, Guitar..."
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Heart className="size-3.5" />
                  Hobbies & Interests
                </Label>
                <TagInput
                  items={lifeStory.hobbies}
                  onAdd={(h) =>
                    setLifeStory((prev) => ({
                      ...prev,
                      hobbies: [...prev.hobbies, h],
                    }))
                  }
                  onRemove={(i) =>
                    setLifeStory((prev) => ({
                      ...prev,
                      hobbies: prev.hobbies.filter((_, idx) => idx !== i),
                    }))
                  }
                  placeholder="e.g., Photography, Fishing, Gardening..."
                />
              </div>
            </div>
          )}

          {/* ---- STEP 5: Life Milestones + Military ---- */}
          {step === 5 && (
            <div className="space-y-4">
              {/* Milestones */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Flag className="size-3.5" />
                  Life Milestones
                </Label>
                {lifeStory.milestones.length > 0 && (
                  <div className="space-y-1">
                    {lifeStory.milestones.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Flag className="size-3 text-primary" />
                          <span className="text-sm">{m.event}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {m.year}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLifeStory((s) => ({
                                ...s,
                                milestones: s.milestones.filter(
                                  (_, idx) => idx !== i
                                ),
                              }))
                            }
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showMilestoneForm ? (
                  <InlineFormRow
                    fields={[
                      {
                        label: "Event",
                        placeholder: "First child born",
                      },
                      { label: "Year", placeholder: "2022" },
                    ]}
                    onSubmit={([event, year]) => {
                      setLifeStory((s) => ({
                        ...s,
                        milestones: [...s.milestones, { event, year }],
                      }));
                      setShowMilestoneForm(false);
                    }}
                    onCancel={() => setShowMilestoneForm(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMilestoneForm(true)}
                    className="gap-1.5 w-full"
                  >
                    <Plus className="size-4" />
                    Add Milestone
                  </Button>
                )}
              </div>

              <Separator />

              {/* Military */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Medal className="size-3.5" />
                  Military Service
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                {lifeStory.military ? (
                  <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        {lifeStory.military.branch}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lifeStory.military.rank}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {lifeStory.military.years}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLifeStory((s) => ({ ...s, military: null }))
                        }
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ) : showMilitaryForm ? (
                  <InlineFormRow
                    fields={[
                      { label: "Branch", placeholder: "U.S. Army" },
                      { label: "Rank", placeholder: "Sergeant" },
                      { label: "Years", placeholder: "2010 - 2014" },
                    ]}
                    onSubmit={([branch, rank, years]) => {
                      setLifeStory((s) => ({
                        ...s,
                        military: { branch, rank, years },
                      }));
                      setShowMilitaryForm(false);
                    }}
                    onCancel={() => setShowMilitaryForm(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMilitaryForm(true)}
                    className="gap-1.5 w-full"
                  >
                    <Plus className="size-4" />
                    Add Service Record
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ---- STEP 6: Review & Create ---- */}
          {step === 6 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Admin of {familyName}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <SummaryItem
                    icon={MapPin}
                    label="Places"
                    count={lifeStory.places.length}
                  />
                  <SummaryItem
                    icon={Briefcase}
                    label="Jobs"
                    count={lifeStory.career.length}
                  />
                  <SummaryItem
                    icon={GraduationCap}
                    label="Education"
                    count={lifeStory.education.length}
                  />
                  <SummaryItem
                    icon={Wrench}
                    label="Skills"
                    count={lifeStory.skills.length}
                  />
                  <SummaryItem
                    icon={Heart}
                    label="Hobbies"
                    count={lifeStory.hobbies.length}
                  />
                  <SummaryItem
                    icon={Flag}
                    label="Milestones"
                    count={lifeStory.milestones.length}
                  />
                </div>

                {lifeStory.military && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Medal className="size-3.5 text-muted-foreground" />
                      <span>
                        {lifeStory.military.branch} &middot;{" "}
                        {lifeStory.military.rank}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You can always update your profile later from the dashboard.
              </p>
            </div>
          )}

          {/* ---- Error message ---- */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* ---- Navigation buttons ---- */}
          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <Button
                variant="ghost"
                onClick={goBack}
                className="gap-1"
                disabled={loading}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            )}
            <div className="flex-1" />

            {step >= 2 && step < TOTAL_STEPS - 1 && (
              <Button
                variant="ghost"
                onClick={goNext}
                className="text-muted-foreground"
              >
                Skip
              </Button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button
                onClick={goNext}
                disabled={!canGoNext()}
                className="gap-1"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="gap-1"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Check className="size-4" />
                    Create Family & Get Started
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary item for review step
// ---------------------------------------------------------------------------
function SummaryItem({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{count}</span>
    </div>
  );
}
