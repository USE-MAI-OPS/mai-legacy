import { DashboardNav } from "@/components/dashboard-nav";
import { FeatureTour } from "@/components/feature-tour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="md:pl-64">{children}</main>
      <FeatureTour />
    </div>
  );
}
