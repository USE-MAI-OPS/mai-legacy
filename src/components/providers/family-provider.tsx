"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveFamilyIdClient, setActiveFamilyIdClient } from "@/lib/active-family";
import { useRouter } from "next/navigation";

export interface HubInfo {
  id: string;
  name: string;
  type: "family" | "circle";
  role: string;
  joinedAt: string;
}

interface FamilyContextValue {
  hubs: HubInfo[];
  activeHubId: string | null;
  activeHub: HubInfo | null;
  switchHub: (hubId: string) => void;
  loading: boolean;
}

const FamilyContext = createContext<FamilyContextValue>({
  hubs: [],
  activeHubId: null,
  activeHub: null,
  switchHub: () => {},
  loading: true,
});

export function useFamilyContext() {
  return useContext(FamilyContext);
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [hubs, setHubs] = useState<HubInfo[]>([]);
  const [activeHubId, setActiveHubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadHubs() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all families/circles the user belongs to
      // Note: families.type column may not exist yet (added in Phase 3 migration)
      // So we default to 'family' if the column doesn't exist
      const { data: memberships } = await supabase
        .from("family_members")
        .select("family_id, role, joined_at, families(id, name)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true });

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const hubList: HubInfo[] = memberships.map((m: Record<string, unknown>) => {
        const family = m.families as Record<string, unknown> | null;
        return {
          id: m.family_id as string,
          name: (family?.name as string) ?? "Unknown",
          type: "family" as const, // Will read from families.type once Phase 3 migration runs
          role: m.role as string,
          joinedAt: m.joined_at as string,
        };
      });

      setHubs(hubList);

      // Determine active hub
      const cookieId = getActiveFamilyIdClient();
      const activeId =
        cookieId && hubList.some((h) => h.id === cookieId)
          ? cookieId
          : hubList[0]?.id ?? null;
      setActiveHubId(activeId);
      setLoading(false);
    }

    loadHubs();
  }, []);

  const switchHub = useCallback(
    (hubId: string) => {
      if (!hubs.some((h) => h.id === hubId)) return;
      setActiveFamilyIdClient(hubId);
      setActiveHubId(hubId);
      router.refresh();
    },
    [hubs, router],
  );

  const activeHub = hubs.find((h) => h.id === activeHubId) ?? null;

  return (
    <FamilyContext.Provider value={{ hubs, activeHubId, activeHub, switchHub, loading }}>
      {children}
    </FamilyContext.Provider>
  );
}
