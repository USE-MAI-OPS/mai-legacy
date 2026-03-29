"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import { NotificationBell } from "@/components/notification-bell";

export function TopBar() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [familyName, setFamilyName] = useState("My Family");

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

  useEffect(() => {
    async function loadFamily() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const cookieId = getActiveFamilyIdClient();

      type MembershipWithFamily = {
        family_id: string;
        families: { name: string } | null;
      };
      const { data: memberships } = (await supabase
        .from("family_members")
        .select("family_id, families(name)")
        .eq("user_id", user.id)) as unknown as {
        data: MembershipWithFamily[] | null;
      };

      if (!memberships || memberships.length === 0) return;
      const active = cookieId
        ? memberships.find((m) => m.family_id === cookieId) ?? memberships[0]
        : memberships[0];
      setFamilyName(active.families?.name ?? "My Family");
    }
    loadFamily();
  }, []);

  return (
    <header
      data-slot="top-bar"
      className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-sm border-b flex items-center justify-between px-4 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {/* Left: Family name with crest icon */}
      <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
        <Users className="h-5 w-5 text-primary shrink-0" />
        <span className="text-base font-bold truncate max-w-[180px]">
          {familyName}
        </span>
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
