export type EntryType =
  | "story"
  | "skill"
  | "recipe"
  | "lesson"
  | "connection"
  | "general";

export type FamilyRole = "admin" | "member";

export type PlanTier = "seedling" | "roots" | "legacy";

export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled" | "trialing";

export type MemberSpecialty =
  | "cook"
  | "storyteller"
  | "handyman"
  | "gardener"
  | "historian"
  | "technology"
  | "sports"
  | "other";

export type EntryVisibility = "family" | "link" | "public";

export type GoalStatus = "active" | "completed" | "archived";

export type RsvpStatus = "going" | "maybe" | "not_going";

export type RelationshipLabel =
  | "Mother"
  | "Father"
  | "Son"
  | "Daughter"
  | "Brother"
  | "Sister"
  | "Grandmother"
  | "Grandfather"
  | "Grandson"
  | "Granddaughter"
  | "Aunt"
  | "Uncle"
  | "Cousin"
  | "Niece"
  | "Nephew"
  | "Spouse"
  | "Partner"
  | "Other";

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

// ---------------------------------------------------------------------------
// Structured entry data — type-specific fields for each entry type
// ---------------------------------------------------------------------------
export interface RecipeData {
  ingredients: { item: string; amount: string; unit: string }[];
  instructions: { step: number; text: string }[];
  prep_time: string;
  cook_time: string;
  servings: string;
  difficulty: "easy" | "medium" | "hard";
  cuisine: string;
  story: string;
  images?: string[];
}

export interface ConnectionData {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  birthday: string;
}

export interface SkillData {
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  what_you_need: string[];
  steps: { order: number; title: string; description: string; tips?: string }[];
  practice_exercises: string[];
  story: string;
  images?: string[];
}

export interface StoryData {
  year: string;
  location: string;
  people_involved: string[];
  narrative: string;
  images?: string[];
}

export interface LessonData {
  context: string;
  lesson_text: string;
  taught_by: string;
  key_takeaways: string[];
  when_learned: string;
  images?: string[];
}

export type EntryStructuredData =
  | { type: "recipe"; data: RecipeData }
  | { type: "connection"; data: ConnectionData }
  | { type: "skill"; data: SkillData }
  | { type: "story"; data: StoryData }
  | { type: "lesson"; data: LessonData }
  | null;

// ---------------------------------------------------------------------------
// Database schema types
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          plan_tier: PlanTier;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          subscription_status: SubscriptionStatus;
          last_export_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          plan_tier?: PlanTier;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          subscription_status?: SubscriptionStatus;
          last_export_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          plan_tier?: PlanTier;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          subscription_status?: SubscriptionStatus;
          last_export_at?: string | null;
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
          nickname: string | null;
          phone: string | null;
          email: string | null;
          occupation: string | null;
          country: string | null;
          state: string | null;
          specialty: MemberSpecialty | null;
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
          nickname?: string | null;
          phone?: string | null;
          email?: string | null;
          occupation?: string | null;
          country?: string | null;
          state?: string | null;
          specialty?: MemberSpecialty | null;
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
          nickname?: string | null;
          phone?: string | null;
          email?: string | null;
          occupation?: string | null;
          country?: string | null;
          state?: string | null;
          specialty?: MemberSpecialty | null;
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
          structured_data: EntryStructuredData;
          is_mature: boolean;
          visibility: EntryVisibility;
          audio_url: string | null;
          audio_duration: number | null;
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
          structured_data?: EntryStructuredData;
          is_mature?: boolean;
          visibility?: EntryVisibility;
          audio_url?: string | null;
          audio_duration?: number | null;
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
          structured_data?: EntryStructuredData;
          is_mature?: boolean;
          visibility?: EntryVisibility;
          audio_url?: string | null;
          audio_duration?: number | null;
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
      family_traditions: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          description: string;
          frequency: string;
          next_occurrence: string | null;
          last_celebrated: string | null;
          cover_image: string | null;
          participants: string[];
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          description?: string;
          frequency?: string;
          next_occurrence?: string | null;
          last_celebrated?: string | null;
          cover_image?: string | null;
          participants?: string[];
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          description?: string;
          frequency?: string;
          next_occurrence?: string | null;
          last_celebrated?: string | null;
          cover_image?: string | null;
          participants?: string[];
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tradition_memories: {
        Row: {
          id: string;
          tradition_id: string;
          family_id: string;
          content: string;
          images: string[];
          created_by: string | null;
          celebrated_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tradition_id: string;
          family_id: string;
          content?: string;
          images?: string[];
          created_by?: string | null;
          celebrated_on?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tradition_id?: string;
          family_id?: string;
          content?: string;
          images?: string[];
          created_by?: string | null;
          celebrated_on?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      entry_reactions: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          family_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          user_id: string;
          family_id: string;
          reaction_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          user_id?: string;
          family_id?: string;
          reaction_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      entry_comments: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          family_id: string;
          parent_comment_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          user_id: string;
          family_id: string;
          parent_comment_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          user_id?: string;
          family_id?: string;
          parent_comment_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_goals: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string;
          target_count: number;
          current_count: number;
          status: GoalStatus;
          assigned_to: string[];
          due_date: string | null;
          created_by: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string;
          target_count?: number;
          current_count?: number;
          status?: GoalStatus;
          assigned_to?: string[];
          due_date?: string | null;
          created_by: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string;
          target_count?: number;
          current_count?: number;
          status?: GoalStatus;
          assigned_to?: string[];
          due_date?: string | null;
          created_by?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_tree_members: {
        Row: {
          id: string;
          family_id: string;
          display_name: string;
          relationship_label: RelationshipLabel | null;
          parent_id: string | null;
          spouse_id: string | null;
          linked_member_id: string | null;
          birth_year: number | null;
          is_deceased: boolean;
          avatar_url: string | null;
          added_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          display_name: string;
          relationship_label?: RelationshipLabel | null;
          parent_id?: string | null;
          spouse_id?: string | null;
          linked_member_id?: string | null;
          birth_year?: number | null;
          is_deceased?: boolean;
          avatar_url?: string | null;
          added_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          display_name?: string;
          relationship_label?: RelationshipLabel | null;
          parent_id?: string | null;
          spouse_id?: string | null;
          linked_member_id?: string | null;
          birth_year?: number | null;
          is_deceased?: boolean;
          avatar_url?: string | null;
          added_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_events: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string;
          event_date: string;
          end_date: string | null;
          location: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string;
          event_date: string;
          end_date?: string | null;
          location?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string;
          event_date?: string;
          end_date?: string | null;
          location?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: RsvpStatus;
          responded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: RsvpStatus;
          responded_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: RsvpStatus;
          responded_at?: string;
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
