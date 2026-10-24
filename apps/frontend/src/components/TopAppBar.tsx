import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  userName: string;
  userRole: string;
  userInitial: string;
  userEmail: string;
}

export default function TopAppBar({
  onToggleSidebar,
  sidebarOpen,
  userName,
  userRole,
  userInitial,
  userEmail,
}: TopAppBarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const title = pageTitles[location.pathname] ?? "Dashboard";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the profile menu on outside click, Escape, or navigation
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-surface border-b border-line flex items-center px-4 gap-3 z-40 transition-all duration-200 ${
        sidebarOpen ? "left-sidebar max-md:left-0" : "left-0"
      }`}
    >
      <button
        className="w-10 h-10 rounded flex items-center justify-center text-ink-2 hover:text-ink hover:bg-raised transition-colors shrink-0"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Icon name={sidebarOpen ? "ri-menu-fold-line" : "ri-menu-unfold-line"} className="text-xl" />
      </button>

      <span className="text-lg font-semibold text-ink truncate">{title}</span>

      <div className="ml-auto relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-3 h-11 pl-1.5 pr-2 rounded-full hover:bg-raised transition-colors"
        >
          <span className="relative shrink-0">
            <span className="w-9 h-9 rounded-full bg-sidebar text-sidebar-ink font-semibold flex items-center justify-center text-sm">
              {userInitial}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-ready border-2 border-surface" />
          </span>
          <span className="hidden sm:block text-left min-w-0">
            <span className="block text-sm font-semibold text-ink leading-tight truncate max-w-[160px]">{userName}</span>
            <span className="block text-xs text-ink-3 leading-tight capitalize">{userRole}</span>
          </span>
          <Icon
            name="ri-arrow-down-s-line"
            className={`text-lg text-ink-3 transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 bg-surface border border-line rounded-xl shadow-pop overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-line">
              <p className="text-sm font-semibold text-ink truncate">{userName}</p>
              {userEmail && <p className="text-xs text-ink-3 truncate">{userEmail}</p>}
              <span className="mt-2 inline-flex items-center h-6 px-2 rounded-full bg-raised text-xs font-medium text-ink-2 capitalize">
                {userRole}
              </span>
            </div>
            <button
              role="menuitem"
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 h-11 text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <Icon name="ri-logout-box-r-line" className="text-lg" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
