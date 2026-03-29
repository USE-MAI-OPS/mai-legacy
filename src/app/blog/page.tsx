import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { allPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog — Family Stories, Heritage Preservation & More",
  description:
    "Guides and stories about preserving family memories, interviewing relatives, and building a lasting family legacy.",
  openGraph: {
    title: "Blog — Family Stories, Heritage Preservation & More",
    description:
      "Guides and stories about preserving family memories, interviewing relatives, and building a lasting family legacy.",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-lora text-xl font-semibold">
            MAI Legacy
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="font-medium text-stone-900">
              Blog
            </Link>
            <Link href="/explore" className="text-stone-600 hover:text-stone-900">
              Explore
            </Link>
            <Link href="/pricing" className="text-stone-600 hover:text-stone-900">
              Pricing
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

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-lora text-4xl font-semibold tracking-tight text-stone-900">
          The MAI Legacy Blog
        </h1>
        <p className="mt-3 text-lg text-stone-600">
          Guides for preserving family stories, interviewing relatives, and
          building a legacy that lasts.
        </p>
      </section>

      {/* Post List */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid gap-8">
          {allPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-lg border border-stone-200 p-6 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                <span className="text-stone-300">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime}
                </span>
              </div>
              <h2 className="mt-2 font-lora text-2xl font-semibold text-stone-900 group-hover:text-stone-700">
                {post.title}
              </h2>
              <p className="mt-2 text-stone-600 leading-relaxed">
                {post.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-stone-900 group-hover:gap-2 transition-all">
                Read article <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} MAI Legacy. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
