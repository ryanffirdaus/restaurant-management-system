import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import "./styles/global.css";
import LoginPage from "./pages/login/LoginPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import UIComponentsPage from "./pages/ui-components/UIComponentsPage";
import MenuPage from "./pages/MenuPage";
import OrdersPage from "./pages/orders/OrdersPage";
import TablesPage from "./pages/tables/TablesPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import WaiterApp from "./pages/waiter/WaiterApp";
import KitchenApp from "./pages/kitchen/KitchenApp";
import CashierApp from "./pages/cashier/CashierApp";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import TopAppBar from "./components/TopAppBar";
import Dashboard from "./components/Dashboard";
import { useAuth } from "./context/AuthContext";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export interface LayoutContext {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

function DashboardLayout() {
  const { user, profile, employeeRole } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  const displayName =
    (profile?.name as string) ??
    user?.user_metadata?.name ??
    user?.email ??
    "User";
  const initial = displayName.charAt(0).toUpperCase();
  const role = employeeRole ?? user?.user_metadata?.role ?? "Staff";

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
        userName={displayName}
        userRole={role}
        userInitial={initial}
      />
      <TopAppBar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <main
        className={`h-screen overflow-y-auto transition-all duration-200 ${
          sidebarOpen ? "ml-sidebar max-md:ml-0" : "ml-0"
        }`}
      >
        <Outlet context={{ sidebarOpen, toggleSidebar } as LayoutContext} />
      </main>
    </>
  );
}

function RoleRouter() {
  const { employeeRole } = useAuth();

  if (employeeRole === "waiter") {
    return (
      <Routes>
        <Route path="*" element={<WaiterApp />} />
      </Routes>
    );
  }

  if (employeeRole === "kitchen") {
    return (
      <Routes>
        <Route path="*" element={<KitchenApp />} />
      </Routes>
    );
  }

  if (employeeRole === "cashier") {
    return (
      <Routes>
        <Route path="*" element={<CashierApp />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="ui-components" element={<UIComponentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleRouter />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
