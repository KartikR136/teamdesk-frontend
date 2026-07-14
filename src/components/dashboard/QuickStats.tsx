import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface StatValue {
  label: string;
  count: number;
  /** True if the source list had more pages — count is a floor, not a total. */
  hasMore: boolean;
}

export function QuickStats({
  stats,
  loading,
}: {
  stats: StatValue[];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-7 w-10 mb-2" />
              <Skeleton className="h-3 w-16" />
            </Card>
          ))
        : stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className={cn("text-2xl font-semibold tracking-tight text-text")}>
                {s.count}
                {s.hasMore && <span className="text-text-subtle">+</span>}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
            </Card>
          ))}
    </div>
  );
}
