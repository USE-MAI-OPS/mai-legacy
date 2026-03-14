"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Target,
  Sparkles,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { getActiveFamilyIdClient } from "@/lib/active-family";
import { useTourOptional } from "@/components/tour/tour-provider";

interface UserInfo {
  displayName: string;
  initials: string;
  role: string;
  familyName: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/family", label: "Family", icon: Users },
  { href: "/entries", label: "Entries", icon: BookOpen },
  { href: "/griot", label: "The Griot", icon: MessageCircle },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
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

      const { data: memberships } = await (supabase as any)
        .from("family_members")
        .select("family_id, display_name, role, families(name)")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return;

      // Use cookie family or first family
      const activeMembership = cookieId
        ? memberships.find((m: any) => m.family_id === cookieId) ?? memberships[0]
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
        familyName: (activeMembership.families as any)?.name ?? "My Family",
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
          <span className="text-lg font-bold">MAI</span>
        </Link>

        {/* Nav links - centered */}
        <nav className="flex items-center justify-center gap-1 flex-1 min-w-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour-step={tourStepMap[item.href]}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: family name + user menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Family name (display only) */}
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px] hidden xl:inline">
              {userInfo.familyName}
            </span>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:bg-accent transition-colors p-1">
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
                  Family Settings
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

      {/* Mobile header */}
      <div
        className={cn(
          "md:hidden flex items-center justify-between h-14 px-4 border-b bg-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <Link href="/dashboard" className="text-lg font-bold">
          MAI Legacy
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm">
          <nav className="bg-card border-b p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <Separator className="my-2" />

            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/help"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              Help & Support
            </Link>

            {tour && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  tour.startTour();
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Replay Tour
              </button>
            )}

            <Separator className="my-2" />
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
