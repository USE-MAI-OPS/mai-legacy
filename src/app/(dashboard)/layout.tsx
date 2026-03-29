import { DashboardNav } from "@/components/dashboard-nav";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { TourProvider } from "@/components/tour/tour-provider";
import { TourOverlay } from "@/components/tour/tour-overlay";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        {/* Skip-to-content for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        {/* Desktop: existing top navbar */}
        <DashboardNav />
        {/* Mobile: new top bar with family name + icons */}
        <TopBar />
        <main id="main-content" className="pt-14 pb-16 md:pb-0">{children}</main>
        {/* Mobile: bottom tab navigation */}
        <BottomNav />
        <TourOverlay />
      </div>
    </TourProvider>
  );
}
