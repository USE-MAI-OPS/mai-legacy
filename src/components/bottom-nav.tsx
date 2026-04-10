"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Sparkles,
  User,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreateSheet } from "@/components/create-sheet";

interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
  isCreate?: boolean;
}

const tabs: NavTab[] = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/family", label: "Family", icon: Users, badge: true },
  { href: "#create", label: "Create", icon: Plus, isCreate: true },
  { href: "/griot", label: "Griot", icon: Sparkles, badge: true },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/feed") return pathname === "/feed" || pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav
        data-slot="bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-sm border-t flex items-center justify-around px-2"
      >
        {tabs.map((tab) => {
          if (tab.isCreate) {
            return (
              <button
                key="create"
                onClick={() => setCreateOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 -mt-3"
                aria-label="Create new memory"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-medium text-primary">
                  Create
                </span>
              </button>
            );
          }

          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1"
            >
              <span className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  fill={active ? "currentColor" : "none"}
                />
                {tab.badge && (
                  <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-primary hidden" data-badge-dot />
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <CreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
