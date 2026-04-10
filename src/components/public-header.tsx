"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/explore", label: "Stories" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300">
      <div className="relative flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Logo — left */}
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-primary hover:opacity-90 transition-opacity"
        >
          MAI Legacy
        </Link>

        {/* Nav — centered */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth — right */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm"
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button size="sm" className="rounded-full px-5 shadow-sm" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
