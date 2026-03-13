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
  ChevronDown,
  Check,
  Plus,
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
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import {
  getActiveFamilyIdClient,
  setActiveFamilyIdClient,
} from "@/lib/active-family";
import { useTourOptional } from "@/components/tour/tour-provider";

interface FamilyInfo {
  id: string;
  name: string;
}

interface UserInfo {
  displayName: string;
  initials: string;
  role: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/family", label: "Family", icon: Users },
  { href: "/entries", label: "Entries", icon: BookOpen },
  { href: "/griot", label: "The Griot", icon: MessageCircle },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help & Support", icon: HelpCircle },
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
  const [families, setFamilies] = useState<FamilyInfo[]>([]);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: "",
    initials: "",
    role: "member",
  });

  useEffect(() => {
    async function loadFamiliesAndUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all families the user belongs to
      const { data: memberships } = await (supabase as any)
        .from("family_members")
        .select("family_id, display_name, role, families(name)")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return;

      const familyList: FamilyInfo[] = memberships.map((m: any) => ({
        id: m.family_id,
        name: (m.families as any)?.name ?? "Unknown Family",
      }));
      setFamilies(familyList);

      // Determine active family
      const cookieId = getActiveFamilyIdClient();
      const validCookie = familyList.find((f) => f.id === cookieId);
      const activeId = validCookie ? cookieId! : familyList[0].id;

      if (!validCookie) {
        setActiveFamilyIdClient(activeId);
      }
      setActiveFamilyId(activeId);

      // Set user info from the active family's membership
      const activeMembership = memberships.find(
        (m: any) => m.family_id === activeId
      );
      if (activeMembership) {
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
        });
      }
    }

    loadFamiliesAndUser();
  }, []);

  function switchFamily(familyId: string) {
    setActiveFamilyIdClient(familyId);
    setActiveFamilyId(familyId);
    window.location.reload();
  }

  const activeFamilyName =
    families.find((f) => f.id === activeFamilyId)?.name ?? "My Family";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold">MAI Legacy</span>
            </Link>
          </div>

          <Separator />

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour-step={tourStepMap[item.href]}
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
          </nav>

          {/* Family switcher + user menu */}
          <div className="px-3 py-4 border-t">
            {/* Family switcher */}
            {families.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 w-full px-3 py-1.5 mb-2 rounded-md hover:bg-accent transition-colors text-left">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium truncate flex-1">
                      {activeFamilyName}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {families.map((fam) => (
                    <DropdownMenuItem
                      key={fam.id}
                      onClick={() => switchFamily(fam.id)}
                      className="flex items-center gap-2"
                    >
                      {fam.id === activeFamilyId ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="w-4" />
                      )}
                      <span className="truncate">{fam.name}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/families/new"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Family
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {activeFamilyName}
                </span>
              </div>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {userInfo.initials || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {userInfo.displayName || "Loading..."}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userInfo.role}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                {tour && (
                  <DropdownMenuItem
                    onClick={() => tour.startTour()}
                  >
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
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-card sticky top-0 z-40">
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
        <div className="md:hidden fixed inset-0 top-14 z-30 bg-background/80 backdrop-blur-sm">
          <nav className="bg-card border-b p-4 space-y-1">
            {/* Mobile family switcher */}
            {families.length > 1 && (
              <>
                <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                  Switch Family
                </div>
                {families.map((fam) => (
                  <button
                    key={fam.id}
                    onClick={() => {
                      switchFamily(fam.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      fam.id === activeFamilyId
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {fam.id === activeFamilyId ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    {fam.name}
                  </button>
                ))}
                <Link
                  href="/families/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Family
                </Link>
                <Separator className="my-2" />
              </>
            )}

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
            {tour && (
              <>
                <Separator className="my-2" />
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
              </>
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
