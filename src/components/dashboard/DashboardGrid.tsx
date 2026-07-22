import { AssignedTasksCard } from "./AssignedTasksCard";
import { NotificationsCard } from "./NotificationsCard";
import { PullRequestsCard } from "./PullRequestsCard";
import { DeploymentsCard } from "./DeploymentsCard";
import { BuildHealthCard } from "./BuildHealthCard";
import { MeetingsCard } from "./MeetingsCard";
import { RecentIssuesCard } from "./RecentIssuesCard";
import { CodingStreakCard } from "./CodingStreakCard";
import { QuickActionsCard } from "./QuickActionsCard";

/**
 * Assembles every widget below the hero row (DeveloperHero + AISummaryCard,
 * which live directly in the page since they're full-width and unique,
 * not repeatable grid items). `items-start` on each two-column row is
 * what actually produces the "different natural heights" the design spec
 * calls for — CSS grid stretches children to the tallest by default, and
 * opting out of that per-row is the whole trick, not a per-widget hack.
 */
export function DashboardGrid() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <AssignedTasksCard />
        <NotificationsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PullRequestsCard />
        <DeploymentsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <BuildHealthCard />
        <MeetingsCard />
      </div>

      <RecentIssuesCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CodingStreakCard />
        <QuickActionsCard />
      </div>
    </div>
  );
}
