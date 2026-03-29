import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import { getPostBySlug, getAllSlugs } from "@/lib/blog/posts";
import { BlogCta } from "@/components/blog/blog-cta";
import type { BlogSection } from "@/lib/blog/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-lora text-xl font-semibold">
            MAI Legacy
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-stone-600 hover:text-stone-900">
              Blog
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        <header className="mb-10">
          <h1 className="font-lora text-4xl font-semibold leading-tight tracking-tight text-stone-900">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-sm text-stone-500">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>
        </header>

        <div className="prose prose-stone prose-lg max-w-none">
          {post.sections.map((section, i) => (
            <Section key={i} section={section} />
          ))}
        </div>

        <BlogCta />
      </article>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-3xl px-6 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} MAI Legacy. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function Section({ section }: { section: BlogSection }) {
  const level = section.level ?? 2;
  const HeadingTag = section.heading
    ? ((`h${level}`) as "h2" | "h3" | "h4")
    : null;

  return (
    <section className="mt-8 first:mt-0">
      {HeadingTag && section.heading && (
        <HeadingTag className="font-lora font-semibold tracking-tight text-stone-900 mt-10 mb-4">
          {section.heading}
        </HeadingTag>
      )}
      <div className="space-y-4">
        {section.content.split("\n\n").map((para, i) => (
          <Paragraph key={i} text={para} />
        ))}
      </div>
    </section>
  );
}

function Paragraph({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Detect ordered list
  if (/^\d+\.\s/.test(trimmed)) {
    const items = trimmed.split("\n").filter(Boolean);
    return (
      <ol className="list-decimal pl-6 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-stone-700 leading-relaxed">
            <InlineMarkdown text={item.replace(/^\d+\.\s*/, "")} />
          </li>
        ))}
      </ol>
    );
  }

  // Detect unordered list
  if (/^[-*]\s/.test(trimmed)) {
    const items = trimmed.split("\n").filter(Boolean);
    return (
      <ul className="list-disc pl-6 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-stone-700 leading-relaxed">
            <InlineMarkdown text={item.replace(/^[-*]\s*/, "")} />
          </li>
        ))}
      </ul>
    );
  }

  // Detect table
  if (trimmed.startsWith("|")) {
    const rows = trimmed
      .split("\n")
      .filter((r) => !r.trim().startsWith("|--") && !r.trim().startsWith("| --") && !/^\|[\s-|]+\|$/.test(r.trim()));
    if (rows.length < 2) return <p className="text-stone-700 leading-relaxed">{trimmed}</p>;
    const headers = rows[0].split("|").filter(Boolean).map((c) => c.trim());
    const dataRows = rows.slice(1).map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
    return (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-200">
              {headers.map((h, i) => (
                <th key={i} className="text-left py-2 px-3 font-semibold text-stone-900">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => (
              <tr key={i} className="border-b border-stone-100">
                {row.map((cell, j) => (
                  <td key={j} className="py-2 px-3 text-stone-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // CTA link style
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const linkText = trimmed.slice(1, -1);
    return (
      <div className="my-8">
        <Link
          href="/auth/signup"
          className="inline-block rounded-md bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
        >
          {linkText} &rarr;
        </Link>
      </div>
    );
  }

  // Code block
  if (trimmed.startsWith("`") && trimmed.endsWith("`") && !trimmed.includes("\n")) {
    return (
      <code className="rounded bg-stone-100 px-2 py-1 text-sm font-mono text-stone-800">
        {trimmed.slice(1, -1)}
      </code>
    );
  }

  return (
    <p className="text-stone-700 leading-relaxed">
      <InlineMarkdown text={trimmed} />
    </p>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle bold (**text**) and italic (*text*)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-stone-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
