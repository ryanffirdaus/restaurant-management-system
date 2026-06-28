import { useLocation } from "react-router-dom";
import Icon from "./Icon";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/menu": "Menu",
  "/orders": "Orders",
  "/employees": "Employees",
  "/tables": "Tables",
  "/payments": "Payments",
  "/analytics": "Analytics",
  "/ui-components": "UI Components",
};

interface TopAppBarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function TopAppBar({
  onToggleSidebar,
  sidebarOpen,
}: TopAppBarProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Dashboard";

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-background border-b border-outline flex items-center px-4 gap-3 z-40 transition-all duration-200 ${
        sidebarOpen ? "left-sidebar max-md:left-0" : "left-0"
      }`}
    >
      <button
        className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors shrink-0"
        onClick={onToggleSidebar}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Icon name={sidebarOpen ? "menu_open" : "menu"} className="text-xl" />
      </button>

      <span className="text-sm font-semibold text-text-main shrink-0">
        {title}
      </span>
    </header>
  );
}
