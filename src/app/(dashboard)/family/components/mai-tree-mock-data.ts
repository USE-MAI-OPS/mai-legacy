// ============================================================================
// MAI Tree — Mock Data
// Single source of truth for all placeholder data.
// Replace with real DB queries in a future session.
// ============================================================================

export interface MockMemberProfile {
  occupation: string;
  location: string;
  bio: string;
  age: number;
  groupType: "family" | "friend" | "work" | "school";
  entryCounts: { type: string; emoji: string; count: number }[];
  recentEntries: { title: string; type: string; timestamp: string }[];
}

// ---------------------------------------------------------------------------
// Named profiles — keyed by display name (lowercased) for easy lookup
// ---------------------------------------------------------------------------
const NAMED_PROFILES: Record<string, MockMemberProfile> = {
  "rose powell": {
    occupation: "Retired Teacher",
    location: "Jackson, Mississippi",
    bio: "The heart of our family, Rose spent 40 years teaching in Jackson's public schools. She believes every story is a seed that grows into a stronger future for the next generation.",
    age: 81,
    groupType: "family",
    entryCounts: [
      { type: "Stories", emoji: "📖", count: 12 },
      { type: "Recipes", emoji: "🍴", count: 8 },
      { type: "Lessons", emoji: "📍", count: 3 },
      { type: "Skills", emoji: "🔧", count: 2 },
    ],
    recentEntries: [
      { title: "Mama's Sweet Potato Pie", type: "Recipe", timestamp: "2 days ago" },
      { title: "The Summer of '72", type: "Story", timestamp: "1 week ago" },
      { title: "Christmas Morning Traditions", type: "Story", timestamp: "2 weeks ago" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Fallback generator — produces plausible-looking data for any node
// ---------------------------------------------------------------------------
const OCCUPATIONS = [
  "Software Engineer",
  "Nurse",
  "Teacher",
  "Artist",
  "Mechanic",
  "Student",
  "Chef",
  "Accountant",
];
const LOCATIONS = [
  "Atlanta, Georgia",
  "Chicago, Illinois",
  "Houston, Texas",
  "Brooklyn, New York",
  "Los Angeles, California",
];
const BIOS = [
  "A keeper of stories and a builder of bridges between generations.",
  "Always first to lend a hand, and last to leave the kitchen.",
  "Quiet strength and sharp wit — the glue that holds us together.",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateFallback(displayName: string): MockMemberProfile {
  const h = hashCode(displayName);
  return {
    occupation: OCCUPATIONS[h % OCCUPATIONS.length],
    location: LOCATIONS[h % LOCATIONS.length],
    bio: BIOS[h % BIOS.length],
    age: 25 + (h % 55),
    groupType: "family",
    entryCounts: [
      { type: "Stories", emoji: "📖", count: 1 + (h % 10) },
      { type: "Recipes", emoji: "🍴", count: h % 6 },
      { type: "Lessons", emoji: "📍", count: h % 4 },
      { type: "Skills", emoji: "🔧", count: h % 3 },
    ],
    recentEntries: [
      { title: "A Favorite Memory", type: "Story", timestamp: "3 days ago" },
      { title: "Sunday Dinner", type: "Recipe", timestamp: "1 week ago" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function getMockProfile(
  _nodeId: string,
  displayName: string
): MockMemberProfile {
  const key = displayName.toLowerCase().trim();
  return NAMED_PROFILES[key] ?? generateFallback(displayName);
}

export function getMockEntryTotal(
  _nodeId: string,
  displayName: string
): number {
  const profile = getMockProfile(_nodeId, displayName);
  return profile.entryCounts.reduce((sum, e) => sum + e.count, 0);
}

// ---------------------------------------------------------------------------
// Griot mock conversation
// ---------------------------------------------------------------------------
export const MOCK_GRIOT_MESSAGES: {
  role: "user" | "assistant";
  text: string;
}[] = [
  {
    role: "user",
    text: "Show me mom's side of the family",
  },
  {
    role: "assistant",
    text: "Here's Sandra's family branch. You have 5 people on your mom's side. I notice Grandma Rose has contributed the most entries (23), while Auntie Mae has none yet.",
  },
];
