export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  excerpt: string;
  sections: BlogSection[];
}

export interface BlogSection {
  heading?: string;
  level?: 2 | 3 | 4;
  content: string;
}
