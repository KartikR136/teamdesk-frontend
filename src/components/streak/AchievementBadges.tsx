import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Achievement } from "@/mock/dashboard";

export function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={24} />}
        title="No badges yet"
        description="Milestone badges (7, 14, 30, 60, 100, 365 days) unlock automatically as your streak grows."
        compact
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map((a) => (
        <Tooltip
          key={a.type}
          content={`Unlocked ${new Date(a.unlockedAt).toLocaleDateString()}`}
        >
          <Badge variant="warning" dot>
            <Trophy size={11} className="mr-0.5" />
            {a.label}
          </Badge>
        </Tooltip>
      ))}
    </div>
  );
}
