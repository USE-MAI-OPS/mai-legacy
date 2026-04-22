"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";

export function TopBar() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY < 10 || currentY < lastScrollY.current) {
      setVisible(true);
    } else if (currentY > lastScrollY.current && currentY > 60) {
      setVisible(false);
    }
    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header
      data-slot="top-bar"
      className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-sm border-b flex items-center justify-between px-4 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {/* Left: Brand */}
      <Link href="/feed" className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold">MAI</span>
      </Link>

      {/* Right: Search + Notifications */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href="/feed"
          className="p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Search feed"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
