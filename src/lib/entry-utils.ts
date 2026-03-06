import type {
  EntryStructuredData,
  RecipeData,
  ConnectionData,
  SkillData,
  StoryData,
  LessonData,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Recipe flattener
// ---------------------------------------------------------------------------
export function flattenRecipe(title: string, data: RecipeData): string {
  const parts: string[] = [];

  parts.push(`Recipe: ${title}`);

  if (data.cuisine) {
    parts.push(`Cuisine: ${data.cuisine}`);
  }

  if (data.difficulty) {
    parts.push(`Difficulty: ${data.difficulty}`);
  }

  if (data.servings) {
    parts.push(`Servings: ${data.servings}`);
  }

  if (data.prep_time || data.cook_time) {
    const times: string[] = [];
    if (data.prep_time) times.push(`Prep: ${data.prep_time}`);
    if (data.cook_time) times.push(`Cook: ${data.cook_time}`);
    parts.push(times.join(", "));
  }

  if (data.story) {
    parts.push(`Story: ${data.story}`);
  }

  if (data.ingredients && data.ingredients.length > 0) {
    const ingredientList = data.ingredients
      .map((ing) =>
        [ing.amount, ing.unit, ing.item].filter(Boolean).join(" ")
      )
      .join("; ");
    parts.push(`Ingredients: ${ingredientList}`);
  }

  if (data.instructions && data.instructions.length > 0) {
    const steps = data.instructions
      .sort((a, b) => a.step - b.step)
      .map((inst) => `Step ${inst.step}: ${inst.text}`)
      .join(". ");
    parts.push(`Instructions: ${steps}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Connection flattener
// ---------------------------------------------------------------------------
export function flattenConnection(title: string, data: ConnectionData): string {
  const parts: string[] = [];

  parts.push(`Connection: ${title}`);

  if (data.name) {
    parts.push(`Name: ${data.name}`);
  }

  if (data.relationship) {
    parts.push(`Relationship: ${data.relationship}`);
  }

  if (data.phone) {
    parts.push(`Phone: ${data.phone}`);
  }

  if (data.email) {
    parts.push(`Email: ${data.email}`);
  }

  if (data.address) {
    parts.push(`Address: ${data.address}`);
  }

  if (data.birthday) {
    parts.push(`Birthday: ${data.birthday}`);
  }

  if (data.notes) {
    parts.push(`Notes: ${data.notes}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Skill flattener
// ---------------------------------------------------------------------------
export function flattenSkill(title: string, data: SkillData): string {
  const parts: string[] = [];

  parts.push(`Skill: ${title}`);

  if (data.difficulty) {
    parts.push(`Difficulty: ${data.difficulty}`);
  }

  if (data.story) {
    parts.push(`Story: ${data.story}`);
  }

  if (data.prerequisites && data.prerequisites.length > 0) {
    parts.push(`Prerequisites: ${data.prerequisites.join(", ")}`);
  }

  if (data.what_you_need && data.what_you_need.length > 0) {
    parts.push(`What you need: ${data.what_you_need.join(", ")}`);
  }

  if (data.steps && data.steps.length > 0) {
    const steps = data.steps
      .sort((a, b) => a.order - b.order)
      .map((s) => {
        let text = `Step ${s.order}: ${s.title} - ${s.description}`;
        if (s.tips) text += ` (Tip: ${s.tips})`;
        return text;
      })
      .join(". ");
    parts.push(`Steps: ${steps}`);
  }

  if (data.practice_exercises && data.practice_exercises.length > 0) {
    parts.push(`Practice exercises: ${data.practice_exercises.join("; ")}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Story flattener
// ---------------------------------------------------------------------------
export function flattenStory(title: string, data: StoryData): string {
  const parts: string[] = [];

  parts.push(`Story: ${title}`);

  if (data.year) {
    parts.push(`Year: ${data.year}`);
  }

  if (data.location) {
    parts.push(`Location: ${data.location}`);
  }

  if (data.people_involved && data.people_involved.length > 0) {
    parts.push(`People involved: ${data.people_involved.join(", ")}`);
  }

  if (data.narrative) {
    parts.push(data.narrative);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Lesson flattener
// ---------------------------------------------------------------------------
export function flattenLesson(title: string, data: LessonData): string {
  const parts: string[] = [];

  parts.push(`Lesson: ${title}`);

  if (data.taught_by) {
    parts.push(`Taught by: ${data.taught_by}`);
  }

  if (data.when_learned) {
    parts.push(`When learned: ${data.when_learned}`);
  }

  if (data.context) {
    parts.push(`Context: ${data.context}`);
  }

  if (data.lesson_text) {
    parts.push(data.lesson_text);
  }

  if (data.key_takeaways && data.key_takeaways.length > 0) {
    parts.push(`Key takeaways: ${data.key_takeaways.join("; ")}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Main dispatcher — flattens any entry's structured data into readable text
// ---------------------------------------------------------------------------
export function flattenEntryContent(
  title: string,
  structuredData: EntryStructuredData
): string {
  if (!structuredData) {
    return title;
  }

  switch (structuredData.type) {
    case "recipe":
      return flattenRecipe(title, structuredData.data);
    case "connection":
      return flattenConnection(title, structuredData.data);
    case "skill":
      return flattenSkill(title, structuredData.data);
    case "story":
      return flattenStory(title, structuredData.data);
    case "lesson":
      return flattenLesson(title, structuredData.data);
    default:
      return title;
  }
}
