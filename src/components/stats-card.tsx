import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-center gap-4 px-5">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
