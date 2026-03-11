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
  Phone,
  Mail,
  Globe,
  UtensilsCrossed,
  Hammer,
  Flower2,
  Archive,
  BookOpen,
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
  MemberSpecialty,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 8;

const EMPTY_LIFE_STORY: LifeStory = {
  career: [],
  places: [],
  education: [],
  skills: [],
  hobbies: [],
  military: null,
  milestones: [],
};

const SPECIALTY_OPTIONS: {
  value: MemberSpecialty;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "cook", label: "Cook", icon: UtensilsCrossed },
  { value: "storyteller", label: "Storyteller", icon: BookOpen },
  { value: "handyman", label: "Handyman", icon: Hammer },
  { value: "gardener", label: "Gardener", icon: Flower2 },
  { value: "historian", label: "Historian", icon: Archive },
  { value: "other", label: "A Bit of Everything", icon: Sparkles },
];

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
  const [familyNames, setFamilyNames] = useState<string[]>([""]);
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [country, setCountry] = useState("");
  const [stateName, setStateName] = useState("");
  const [specialty, setSpecialty] = useState<MemberSpecialty | "">("");
  const [lifeStory, setLifeStory] = useState<LifeStory>(EMPTY_LIFE_STORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline form toggles
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showMilitaryForm, setShowMilitaryForm] = useState(false);

  const validFamilyNames = familyNames
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const handleCreate = async () => {
    if (validFamilyNames.length === 0 || !displayName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const profileFields = {
        nickname: nickname.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        occupation: occupation.trim() || undefined,
        country: country.trim() || undefined,
        state: stateName.trim() || undefined,
        specialty: specialty || undefined,
      };

      // Create each family — first one gets full profile data,
      // subsequent ones inherit from the first membership row
      for (let i = 0; i < validFamilyNames.length; i++) {
        const isFirst = i === 0;
        const result = await createFamily(
          validFamilyNames[i],
          displayName,
          isFirst ? lifeStory : undefined,
          isFirst ? profileFields : undefined
        );
        if (result?.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
      }

      // Success — navigate to dashboard
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 0) return validFamilyNames.length > 0;
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
      icon: Globe,
      title: "Where You're From",
      description:
        "The places that shaped you. Add as many as you'd like, or skip for now.",
    },
    {
      icon: Sparkles,
      title: "What's Your Specialty?",
      description:
        "Pick what you're known for in the family. You can always change this later.",
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
      icon: Check,
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
          {/* ---- STEP 0: Family Names ---- */}
          {step === 0 && (
            <div className="space-y-3">
              {familyNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    {i === 0 && <Label>Family Name</Label>}
                    <Input
                      placeholder={
                        i === 0
                          ? "e.g., The Powell Family"
                          : "e.g., Mom's Side, Dad's Side"
                      }
                      value={name}
                      onChange={(e) => {
                        const updated = [...familyNames];
                        updated[i] = e.target.value;
                        setFamilyNames(updated);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && canGoNext() && goNext()
                      }
                      autoFocus={i === 0}
                    />
                  </div>
                  {familyNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFamilyNames(familyNames.filter((_, idx) => idx !== i))
                      }
                      className="mt-auto mb-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFamilyNames([...familyNames, ""])}
                className="gap-1.5 w-full"
              >
                <Plus className="size-4" />
                Add Another Family
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You can create separate families for different branches (e.g.,
                Mom&apos;s Side, Dad&apos;s Side). Each family has its own
                entries and members.
              </p>
            </div>
          )}

          {/* ---- STEP 1: About You ---- */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Big K, Rosie, etc."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Visible to family members so they can reach you.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Current Occupation</Label>
                <Input
                  id="occupation"
                  placeholder="e.g., Retired Teacher, Software Engineer"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>

              <div className="rounded-md border p-3 bg-muted/50 space-y-1">
                {validFamilyNames.map((name, i) => (
                  <p key={i} className="text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      &middot; {i === 0 ? "You'll be the admin" : "Member"}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ---- STEP 2: Where You're From ---- */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="e.g., United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-name">State / Province</Label>
                  <Input
                    id="state-name"
                    placeholder="e.g., Georgia"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="size-3.5" />
                  Places Lived
                </Label>
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
            </div>
          )}

          {/* ---- STEP 3: What's Your Specialty? ---- */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = specialty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setSpecialty(isSelected ? "" : opt.value)
                    }
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-background"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </div>
                    )}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ---- STEP 4: Career & Education ---- */}
          {step === 4 && (
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

          {/* ---- STEP 5: Skills & Interests ---- */}
          {step === 5 && (
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

          {/* ---- STEP 6: Life Milestones + Military ---- */}
          {step === 6 && (
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

          {/* ---- STEP 7: Review & Create ---- */}
          {step === 7 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {displayName}
                      {nickname && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          &ldquo;{nickname}&rdquo;
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admin of {validFamilyNames.join(", ")}
                    </p>
                  </div>
                </div>

                {(occupation || email || phone) && (
                  <>
                    <Separator />
                    <div className="space-y-1.5 text-sm">
                      {occupation && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-3.5 text-muted-foreground" />
                          <span>{occupation}</span>
                        </div>
                      )}
                      {email && (
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <span>{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(country || stateName) && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <span>
                        {[stateName, country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </>
                )}

                {specialty && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="size-3.5 text-muted-foreground" />
                      <span>
                        Specialty:{" "}
                        {SPECIALTY_OPTIONS.find((o) => o.value === specialty)
                          ?.label ?? specialty}
                      </span>
                    </div>
                  </>
                )}

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
