"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_STORAGE_KEY } from "@/components/tour/tour-steps";

/**
 * Button that allows users to re-launch the tour from settings/help.
 * Can be used outside of the TourProvider context — it simply clears
 * localStorage and reloads so the provider auto-starts the tour.
 */
export function RelaunchTourButton() {
  const handleRelaunch = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRelaunch}
      className="gap-1.5"
    >
      <Sparkles className="size-3.5" />
      Replay Feature Tour
    </Button>
  );
}
