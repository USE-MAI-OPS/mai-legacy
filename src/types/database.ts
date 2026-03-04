export type EntryType =
  | "story"
  | "skill"
  | "recipe"
  | "lesson"
  | "connection"
  | "general";

export type FamilyRole = "admin" | "member";

export type PlanTier = "seedling" | "roots" | "legacy";

// ---------------------------------------------------------------------------
// Life Story types — used in onboarding, profile, and My Story section
// ---------------------------------------------------------------------------
export interface CareerItem {
  title: string;
  company: string;
  years: string;
}

export interface PlaceItem {
  city: string;
  state: string;
  years: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  year: string;
}

export interface MilitaryInfo {
  branch: string;
  rank: string;
  years: string;
}

export interface MilestoneItem {
  event: string;
  year: string;
}

export interface LifeStory {
  career: CareerItem[];
  places: PlaceItem[];
  education: EducationItem[];
  skills: string[];
  hobbies: string[];
  military: MilitaryInfo | null;
  milestones: MilestoneItem[];
}

/**
 * Ensures a life_story value (potentially {} from DB default) has all required
 * fields with correct types. Safe to call with null/undefined/partial data.
 */
export function normalizeLifeStory(raw: unknown): LifeStory {
  if (!raw || typeof raw !== "object") {
    return {
      career: [],
      places: [],
      education: [],
      skills: [],
      hobbies: [],
      military: null,
      milestones: [],
    };
  }
  const obj = raw as Record<string, unknown>;
  return {
    career: Array.isArray(obj.career) ? obj.career : [],
    places: Array.isArray(obj.places) ? obj.places : [],
    education: Array.isArray(obj.education) ? obj.education : [],
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    hobbies: Array.isArray(obj.hobbies) ? obj.hobbies : [],
    military: obj.military && typeof obj.military === "object" ? (obj.military as MilitaryInfo) : null,
    milestones: Array.isArray(obj.milestones) ? obj.milestones : [],
  };
}

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          plan_tier: PlanTier;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          plan_tier?: PlanTier;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          plan_tier?: PlanTier;
          created_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: FamilyRole;
          display_name: string;
          avatar_url: string | null;
          life_story: LifeStory;
          joined_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: FamilyRole;
          display_name: string;
          avatar_url?: string | null;
          life_story?: LifeStory;
          joined_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          role?: FamilyRole;
          display_name?: string;
          avatar_url?: string | null;
          life_story?: LifeStory;
          joined_at?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          family_id: string;
          author_id: string;
          title: string;
          content: string;
          type: EntryType;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          author_id: string;
          title: string;
          content: string;
          type: EntryType;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          type?: EntryType;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entry_embeddings: {
        Row: {
          id: string;
          entry_id: string;
          family_id: string;
          chunk_text: string;
          embedding: number[];
          chunk_index: number;
        };
        Insert: {
          id?: string;
          entry_id: string;
          family_id: string;
          chunk_text: string;
          embedding: number[];
          chunk_index: number;
        };
        Update: {
          id?: string;
          entry_id?: string;
          family_id?: string;
          chunk_text?: string;
          embedding?: number[];
          chunk_index?: number;
        };
        Relationships: [];
      };
      skill_tutorials: {
        Row: {
          id: string;
          entry_id: string;
          family_id: string;
          steps: TutorialStep[];
          difficulty_level: string;
          estimated_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          family_id: string;
          steps: TutorialStep[];
          difficulty_level?: string;
          estimated_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          family_id?: string;
          steps?: TutorialStep[];
          difficulty_level?: string;
          estimated_time?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      griot_conversations: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          messages: ConversationMessage[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          messages?: ConversationMessage[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          messages?: ConversationMessage[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_invites: {
        Row: {
          id: string;
          family_id: string;
          email: string;
          invited_by: string;
          role: FamilyRole;
          accepted: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          email: string;
          invited_by: string;
          role?: FamilyRole;
          accepted?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          email?: string;
          invited_by?: string;
          role?: FamilyRole;
          accepted?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_entry_embeddings: {
        Args: {
          query_embedding: number[];
          match_family_id: string;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          entry_id: string;
          chunk_text: string;
          similarity: number;
        }[];
      };
    };
  };
}

export interface TutorialStep {
  order: number;
  title: string;
  description: string;
  tips?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: { entry_id: string; chunk_text: string }[];
}
