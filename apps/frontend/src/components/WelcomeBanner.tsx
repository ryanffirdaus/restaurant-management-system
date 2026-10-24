import Icon from "./Icon";

interface WelcomeBannerProps {
  name?: string;
  newOrders?: number;
  revenue?: string;
}

export default function WelcomeBanner({
  name = "Manager Profile",
  newOrders = 12,
  revenue = "$4.2K",
}: WelcomeBannerProps) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="bg-gradient-to-br from-sidebar-raised to-sidebar text-sidebar-ink rounded-xl p-card-padding flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <p className="text-sm text-sidebar-ink-2 capitalize">{today}</p>
        <h2 className="text-2xl font-semibold text-sidebar-ink">Welcome back, {name}</h2>
        <p className="text-sm text-sidebar-ink-2">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-white/15 text-sidebar-ink font-medium">
            <span className="status-pulse is-live" /> {newOrders} active orders
          </span>
          <span className="text-sidebar-ink-2"> · </span>
          <span className="text-sidebar-ink font-medium num">{revenue}</span> revenue today
        </p>
      </div>
      <button
        className="h-11 px-4 rounded bg-sidebar-accent text-sidebar-accent-fg text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0 self-start md:self-auto"
        onClick={() => (window.location.href = "/analytics")}
      >
        View Analytics <Icon name="ri-arrow-right-line" className="text-sm" />
      </button>
    </div>
  );
}
