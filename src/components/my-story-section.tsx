"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  GraduationCap,
  Heart,
  Wrench,
  Medal,
  Flag,
  Pencil,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LifeStory,
  CareerItem,
  PlaceItem,
  EducationItem,
  MilestoneItem,
} from "@/types/database";

// Re-export for convenience
export type { LifeStory };

// ---------------------------------------------------------------------------
// Empty default
// ---------------------------------------------------------------------------
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
// Expandable section wrapper
// ---------------------------------------------------------------------------
function StorySection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t">{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag input component
// ---------------------------------------------------------------------------
function TagList({
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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="gap-1 pl-2.5 pr-1.5 py-1"
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              className="ml-0.5 hover:text-destructive transition-colors"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), handleAdd())
          }
          placeholder={placeholder}
          className="text-sm h-8"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-8 px-2.5"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MyStorySection({
  initialData,
  onSave,
}: {
  initialData?: LifeStory;
  onSave?: (story: LifeStory) => Promise<void>;
}) {
  const [story, setStory] = useState<LifeStory>(
    initialData ?? EMPTY_LIFE_STORY
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Wrapper to mark changes
  const update = (updater: (s: LifeStory) => LifeStory) => {
    setStory((prev) => {
      const next = updater(prev);
      setDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(story);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  // --- Add/edit item forms state ---
  // null = hidden, -1 = adding new, >= 0 = editing that index
  const [careerFormIdx, setCareerFormIdx] = useState<number | null>(null);
  const [placeFormIdx, setPlaceFormIdx] = useState<number | null>(null);
  const [eduFormIdx, setEduFormIdx] = useState<number | null>(null);
  const [milestoneFormIdx, setMilestoneFormIdx] = useState<number | null>(null);
  const [militaryFormIdx, setMilitaryFormIdx] = useState<number | null>(null);

  // Convenience booleans
  const showCareerForm = careerFormIdx !== null;
  const showPlaceForm = placeFormIdx !== null;
  const showEduForm = eduFormIdx !== null;
  const showMilestoneForm = milestoneFormIdx !== null;
  const showMilitaryForm = militaryFormIdx !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="size-4 text-pink-500" />
              My Story
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your life resume — the places, experiences, and milestones that
              shaped you.
            </p>
          </div>
          {onSave && dirty && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5"
            >
              <Save className="size-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Career */}
        <StorySection title="Career History" icon={Briefcase} defaultOpen>
          <div className="space-y-2 mt-2">
            {story.career.map((c, i) => (
              <div
                key={i}
                className="flex items-start justify-between py-1.5"
              >
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.company}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">
                    {c.years}
                  </span>
                  <button
                    onClick={() => setCareerFormIdx(i)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        career: s.career.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            {story.career.length === 0 && !showCareerForm && (
              <p className="text-xs text-muted-foreground py-2">
                No career history added yet.
              </p>
            )}
            {showCareerForm ? (
              <InlineForm
                fields={["Title", "Company", { name: "Years", type: "year-range" }]}
                initialValues={
                  careerFormIdx !== null && careerFormIdx >= 0
                    ? [story.career[careerFormIdx].title, story.career[careerFormIdx].company, story.career[careerFormIdx].years]
                    : undefined
                }
                onSubmit={([title, company, years]) => {
                  if (careerFormIdx !== null && careerFormIdx >= 0) {
                    // Editing existing
                    update((s) => ({
                      ...s,
                      career: s.career.map((item, idx) =>
                        idx === careerFormIdx ? { title, company, years } : item
                      ),
                    }));
                  } else {
                    // Adding new
                    update((s) => ({
                      ...s,
                      career: [...s.career, { title, company, years }],
                    }));
                  }
                  setCareerFormIdx(null);
                }}
                onCancel={() => setCareerFormIdx(null)}
              />
            ) : (
              <AddButton onClick={() => setCareerFormIdx(-1)} />
            )}
          </div>
        </StorySection>

        {/* Places Lived */}
        <StorySection title="Places Lived" icon={MapPin}>
          <div className="space-y-2 mt-2">
            {story.places.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
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
                    onClick={() => setPlaceFormIdx(i)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        places: s.places.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            {story.places.length === 0 && !showPlaceForm && (
              <p className="text-xs text-muted-foreground py-2">
                No places added yet.
              </p>
            )}
            {showPlaceForm ? (
              <InlineForm
                fields={["City", "State", { name: "Years", type: "year-range" }]}
                initialValues={
                  placeFormIdx !== null && placeFormIdx >= 0
                    ? [story.places[placeFormIdx].city, story.places[placeFormIdx].state, story.places[placeFormIdx].years]
                    : undefined
                }
                onSubmit={([city, state, years]) => {
                  if (placeFormIdx !== null && placeFormIdx >= 0) {
                    update((s) => ({
                      ...s,
                      places: s.places.map((item, idx) =>
                        idx === placeFormIdx ? { city, state, years } : item
                      ),
                    }));
                  } else {
                    update((s) => ({
                      ...s,
                      places: [...s.places, { city, state, years }],
                    }));
                  }
                  setPlaceFormIdx(null);
                }}
                onCancel={() => setPlaceFormIdx(null)}
              />
            ) : (
              <AddButton onClick={() => setPlaceFormIdx(-1)} />
            )}
          </div>
        </StorySection>

        {/* Education */}
        <StorySection title="Education" icon={GraduationCap}>
          <div className="space-y-2 mt-2">
            {story.education.map((e, i) => (
              <div
                key={i}
                className="flex items-start justify-between py-1.5"
              >
                <div>
                  <p className="text-sm font-medium">{e.school}</p>
                  <p className="text-xs text-muted-foreground">{e.degree}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">
                    {e.year}
                  </span>
                  <button
                    onClick={() => setEduFormIdx(i)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        education: s.education.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            {story.education.length === 0 && !showEduForm && (
              <p className="text-xs text-muted-foreground py-2">
                No education added yet.
              </p>
            )}
            {showEduForm ? (
              <InlineForm
                fields={["School", "Degree", "Year"]}
                initialValues={
                  eduFormIdx !== null && eduFormIdx >= 0
                    ? [story.education[eduFormIdx].school, story.education[eduFormIdx].degree, story.education[eduFormIdx].year]
                    : undefined
                }
                onSubmit={([school, degree, year]) => {
                  if (eduFormIdx !== null && eduFormIdx >= 0) {
                    update((s) => ({
                      ...s,
                      education: s.education.map((item, idx) =>
                        idx === eduFormIdx ? { school, degree, year } : item
                      ),
                    }));
                  } else {
                    update((s) => ({
                      ...s,
                      education: [...s.education, { school, degree, year }],
                    }));
                  }
                  setEduFormIdx(null);
                }}
                onCancel={() => setEduFormIdx(null)}
              />
            ) : (
              <AddButton onClick={() => setEduFormIdx(-1)} />
            )}
          </div>
        </StorySection>

        {/* Skills & Talents */}
        <StorySection title="Skills & Talents" icon={Wrench}>
          <div className="mt-2">
            <TagList
              items={story.skills}
              onAdd={(s) =>
                update((prev) => ({
                  ...prev,
                  skills: [...prev.skills, s],
                }))
              }
              onRemove={(i) =>
                update((prev) => ({
                  ...prev,
                  skills: prev.skills.filter((_, idx) => idx !== i),
                }))
              }
              placeholder="Add a skill..."
            />
          </div>
        </StorySection>

        {/* Hobbies & Interests */}
        <StorySection title="Hobbies & Interests" icon={Heart}>
          <div className="mt-2">
            <TagList
              items={story.hobbies}
              onAdd={(h) =>
                update((prev) => ({
                  ...prev,
                  hobbies: [...prev.hobbies, h],
                }))
              }
              onRemove={(i) =>
                update((prev) => ({
                  ...prev,
                  hobbies: prev.hobbies.filter((_, idx) => idx !== i),
                }))
              }
              placeholder="Add a hobby..."
            />
          </div>
        </StorySection>

        {/* Military Service */}
        <StorySection title="Military Service" icon={Medal}>
          <div className="mt-2">
            {story.military && !showMilitaryForm ? (
              <div className="flex items-start justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium">
                    {story.military.branch}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {story.military.rank}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {story.military.years}
                  </span>
                  <button
                    onClick={() => setMilitaryFormIdx(0)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => update((s) => ({ ...s, military: null }))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ) : showMilitaryForm ? (
              <InlineForm
                fields={["Branch", "Rank", { name: "Years", type: "year-range" }]}
                initialValues={
                  militaryFormIdx !== null && militaryFormIdx >= 0 && story.military
                    ? [story.military.branch, story.military.rank, story.military.years]
                    : undefined
                }
                onSubmit={([branch, rank, years]) => {
                  update((s) => ({
                    ...s,
                    military: { branch, rank, years },
                  }));
                  setMilitaryFormIdx(null);
                }}
                onCancel={() => setMilitaryFormIdx(null)}
              />
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground mb-2">
                  No military service recorded.
                </p>
                <AddButton
                  onClick={() => setMilitaryFormIdx(-1)}
                  label="Add Service Record"
                />
              </div>
            )}
          </div>
        </StorySection>

        {/* Life Milestones */}
        <StorySection title="Life Milestones" icon={Flag}>
          <div className="space-y-2 mt-2">
            {story.milestones
              .sort((a, b) => (b.year > a.year ? 1 : -1))
              .map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Flag className="size-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm">{m.event}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {m.year}
                    </span>
                    <button
                      onClick={() => setMilestoneFormIdx(i)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          milestones: s.milestones.filter(
                            (_, idx) => idx !== i
                          ),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            {story.milestones.length === 0 && !showMilestoneForm && (
              <p className="text-xs text-muted-foreground py-2">
                No milestones added yet.
              </p>
            )}
            {showMilestoneForm ? (
              <InlineForm
                fields={["Event", "Year"]}
                initialValues={
                  milestoneFormIdx !== null && milestoneFormIdx >= 0
                    ? [story.milestones[milestoneFormIdx].event, story.milestones[milestoneFormIdx].year]
                    : undefined
                }
                onSubmit={([event, year]) => {
                  if (milestoneFormIdx !== null && milestoneFormIdx >= 0) {
                    update((s) => ({
                      ...s,
                      milestones: s.milestones.map((item, idx) =>
                        idx === milestoneFormIdx ? { event, year } : item
                      ),
                    }));
                  } else {
                    update((s) => ({
                      ...s,
                      milestones: [...s.milestones, { event, year }],
                    }));
                  }
                  setMilestoneFormIdx(null);
                }}
                onCancel={() => setMilestoneFormIdx(null)}
              />
            ) : (
              <AddButton onClick={() => setMilestoneFormIdx(-1)} />
            )}
          </div>
        </StorySection>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function AddButton({
  onClick,
  label = "Add",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-1.5 text-xs h-7 mt-1"
    >
      <Plus className="size-3" />
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Year range select for profile forms
// ---------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1939 }, (_, i) => CURRENT_YEAR - i);

function YearRangeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const parts = value.split(" - ");
  const startYear = parts[0] || "";
  const endYear = parts[1] || "";

  const updateRange = (start: string, end: string) => {
    if (start && end) {
      onChange(`${start} - ${end}`);
    } else if (start) {
      onChange(start);
    } else {
      onChange("");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={startYear}
        onChange={(e) => updateRange(e.target.value, endYear)}
        className="flex-1 h-8 rounded-md border border-input bg-background px-1.5 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Start</option>
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">—</span>
      <select
        value={endYear}
        onChange={(e) => updateRange(startYear, e.target.value)}
        className="flex-1 h-8 rounded-md border border-input bg-background px-1.5 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">End</option>
        <option value="Present">Present</option>
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

function InlineForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
}: {
  fields: (string | { name: string; type: "year-range" })[];
  initialValues?: string[];
  onSubmit: (values: string[]) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<string[]>(
    initialValues ?? fields.map(() => "")
  );

  const handleSubmit = () => {
    if (values.every((v) => v.trim())) {
      onSubmit(values.map((v) => v.trim()));
    }
  };

  const fieldNames = fields.map((f) => (typeof f === "string" ? f : f.name));
  const fieldTypes = fields.map((f) => (typeof f === "string" ? "text" : f.type));

  return (
    <div className="space-y-2 pt-2 border-t">
      <div
        className={cn(
          "grid gap-2",
          fields.length === 2 ? "grid-cols-2" : "grid-cols-3"
        )}
      >
        {fieldNames.map((field, i) => (
          <div key={field} className="space-y-1">
            <span className="text-xs text-muted-foreground">{field}</span>
            {fieldTypes[i] === "year-range" ? (
              <YearRangeSelect
                value={values[i]}
                onChange={(val) => {
                  const newValues = [...values];
                  newValues[i] = val;
                  setValues(newValues);
                }}
              />
            ) : (
              <Input
                placeholder={field}
                value={values[i]}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[i] = e.target.value;
                  setValues(newValues);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="text-sm h-8"
                autoFocus={i === 0}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} className="h-7 text-xs">
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
