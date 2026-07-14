function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({
  name,
  orgName,
}: {
  name: string | undefined;
  orgName: string;
}) {
  const firstName = name?.split(" ")[0] ?? "";

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        {timeOfDayGreeting()}
        {firstName && `, ${firstName}`}
      </h1>
      <p className="text-sm text-text-muted mt-0.5">{orgName}</p>
    </div>
  );
}
