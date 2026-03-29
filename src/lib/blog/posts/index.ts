import type { BlogPost } from "../types";
import howToInterviewYourGrandmother from "./how-to-interview-your-grandmother";
import howToPreserveFamilyStoriesDigitally from "./how-to-preserve-family-stories-digitally";
import familyHistoryInterviewQuestions from "./family-history-interview-questions";
import privateFamilyPhotoSharingApp from "./private-family-photo-sharing-app";

export const allPosts: BlogPost[] = [
  howToInterviewYourGrandmother,
  howToPreserveFamilyStoriesDigitally,
  familyHistoryInterviewQuestions,
  privateFamilyPhotoSharingApp,
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return allPosts.map((p) => p.slug);
}
