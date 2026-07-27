"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import type { HeatmapCell } from "@/mock/dashboard";

const LEVEL_CLASS: Record<number, string> = {
  0: "bg-surface-hover",
  1: "bg-info/40", // frozen day
  2: "bg-success/70",
  3: "bg-success",
};

/** Renders a 90-day GitHub-style activity grid, chunked into weekly
 * columns (7 rows) so it reads left-to-right as oldest -> most recent. */
export function StreakHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const columns: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-1">
          {col.map((cell) => (
            <Tooltip
              key={cell.date}
              content={
                cell.frozen
                  ? `${cell.date} — covered by a streak freeze`
                  : cell.level > 0
                    ? `${cell.date} — active`
                    : `${cell.date} — no activity`
              }
            >
              <div
                className={cn(
                  "h-3 w-3 rounded-sm",
                  LEVEL_CLASS[cell.level],
                )}
              />
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
}
