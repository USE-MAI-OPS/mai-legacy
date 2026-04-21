"use client";

import { createContext, useContext, useState, useEffect, useCallback, useTransition, type ReactNode } from "react";
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
  /** All hub IDs the user belongs to — use for aggregated queries */
  allHubIds: string[];
  switchHub: (hubId: string) => void;
  loading: boolean;
  /** True while the server is re-rendering after a hub switch */
  isHubSwitching: boolean;
}

const FamilyContext = createContext<FamilyContextValue>({
  hubs: [],
  activeHubId: null,
  activeHub: null,
  allHubIds: [],
  switchHub: () => {},
  loading: true,
  isHubSwitching: false,
});

export function useFamilyContext() {
  return useContext(FamilyContext);
}

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [hubs, setHubs] = useState<HubInfo[]>([]);
  const [activeHubId, setActiveHubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
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

      const { data: memberships } = await supabase
        .from("family_members")
        .select("family_id, role, joined_at, families(id, name, type)")
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
          type: ((family?.type as string) ?? "family") as "family" | "circle",
          role: m.role as string,
          joinedAt: m.joined_at as string,
        };
      });

      setHubs(hubList);

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
      startTransition(() => {
        router.refresh();
      });
    },
    [hubs, router],
  );

  const activeHub = hubs.find((h) => h.id === activeHubId) ?? null;
  const allHubIds = hubs.map((h) => h.id);

  return (
    <FamilyContext.Provider value={{ hubs, activeHubId, activeHub, allHubIds, switchHub, loading, isHubSwitching: isPending }}>
      {children}
    </FamilyContext.Provider>
  );
}
