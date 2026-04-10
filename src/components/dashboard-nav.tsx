"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  User,
  Users,
  LogOut,
  Sparkles,
  HelpCircle,
  Settings,
  ChevronDown,
  BookMarked,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import { useTourOptional } from "@/components/tour/tour-provider";
import { NotificationBell } from "@/components/notification-bell";
import { HubSwitcher } from "@/components/hub-switcher";
import { useFamilyContext } from "@/components/providers/family-provider";

interface UserInfo {
  displayName: string;
  initials: string;
  role: string;
  familyName: string;
}

/** Map nav hrefs to data-tour-step attribute values */
const tourStepMap: Record<string, string> = {
  "/entries": "nav-entries",
  "/griot": "nav-griot",
  "/family": "nav-family",
  "/profile": "nav-profile",
};

export function DashboardNav() {
  const pathname = usePathname();
  const tour = useTourOptional();
  const { activeHub } = useFamilyContext();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: "",
    initials: "",
    role: "member",
    familyName: "My Family",
  });

  // Auto-hide navbar on scroll
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);

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

  // Show navbar when mouse is near the top of the screen
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (e.clientY < 16) {
        setVisible(true);
      }
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    async function loadUserInfo() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const cookieId = getActiveFamilyIdClient();

      type MembershipWithFamily = {
        family_id: string;
        display_name: string | null;
        role: string;
        families: { name: string } | null;
      };
      const { data: memberships } = await supabase
        .from("family_members")
        .select("family_id, display_name, role, families(name)")
        .eq("user_id", user.id) as unknown as { data: MembershipWithFamily[] | null };

      if (!memberships || memberships.length === 0) return;

      // Use cookie family or first family
      const activeMembership = cookieId
        ? memberships.find((m) => m.family_id === cookieId) ?? memberships[0]
        : memberships[0];

      const name = activeMembership.display_name || "User";
      setUserInfo({
        displayName: name,
        initials: name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        role: activeMembership.role || "member",
        familyName: activeMembership.families?.name ?? "My Family",
      });
    }

    loadUserInfo();
  }, []);

  return (
    <>
      {/* Desktop top navbar */}
      <header
        ref={navRef}
        className={cn(
          "hidden md:flex items-center h-14 px-6 fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b transition-transform duration-300",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 shrink-0"
        >
          <span className="text-xl font-bold">MAI</span>
        </Link>

        {/* Nav links - absolutely centered in viewport */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-medium transition-colors whitespace-nowrap",
              pathname === "/dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Dashboard
          </Link>

          <Link
            href="/feed"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-medium transition-colors whitespace-nowrap",
              pathname === "/feed"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Feed
          </Link>

          {/* Our Legacy Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-base font-medium transition-colors outline-none whitespace-nowrap",
                pathname.startsWith("/entries") || pathname.startsWith("/skills")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Memories <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/entries" className="w-full cursor-pointer">All Memories</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/entries?type=story" className="w-full cursor-pointer">📖 Stories</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/entries?type=recipe" className="w-full cursor-pointer">🍳 Recipes</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/entries?type=skill" className="w-full cursor-pointer">🛠️ Skills</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/entries?type=connection" className="w-full cursor-pointer">🤝 Connections</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/legacy-book" className="w-full cursor-pointer flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-amber-600" />
                  Legacy Book
                  <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">Pro</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Our Family Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-base font-medium transition-colors outline-none whitespace-nowrap font-serif",
                pathname.startsWith("/family") || pathname.startsWith("/goals") || pathname.startsWith("/messages")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {activeHub?.type === "circle" ? "Our Circle" : "Our Family"} <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/family" className="w-full cursor-pointer">{activeHub?.type === "circle" ? "Circle Hub" : "Family Hub"}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/family/tree" className="w-full cursor-pointer">MAI Tree</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/goals" className="w-full cursor-pointer">Goals</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/messages" className="w-full cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/family#traditions" className="w-full cursor-pointer">Traditions</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* The Griot */}
          <Link
            href="/griot"
            data-tour-step="nav-griot"
            className="ml-2 flex items-center gap-2 px-4 py-1.5 rounded-full text-base font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap font-serif shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            The Griot
          </Link>
        </nav>

        {/* Right side: family name + notifications + user menu */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <HubSwitcher />

          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Open user menu" className="flex items-center gap-2 rounded-full hover:bg-accent transition-colors p-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {userInfo.initials || "??"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">
                  {userInfo.displayName || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userInfo.role}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/family/settings">
                  <Users className="mr-2 h-4 w-4" />
                  {activeHub?.type === "circle" ? "Circle Settings" : "Family Settings"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
              {tour && (
                <DropdownMenuItem onClick={() => tour.startTour()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Replay Tour
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-destructive p-0">
                <form action={signOut} className="w-full">
                  <button
                    type="submit"
                    className="flex items-center w-full px-2 py-1.5 text-sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
