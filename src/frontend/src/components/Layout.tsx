import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { type Page, useAppContext } from "../context/AppContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import Dashboard from "../pages/Dashboard";
import DocumentVault from "../pages/DocumentVault";
import DutyRoster from "../pages/DutyRoster";
import LeaveManagement from "../pages/LeaveManagement";
import Notices from "../pages/Notices";
import StaffDirectory from "../pages/StaffDirectory";

type NavItem = {
  id: Page;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "staff",
    label: "Staff Directory",
    icon: <Users className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    id: "roster",
    label: "Duty Roster",
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    id: "notices",
    label: "Official Notices",
    icon: <Bell className="w-5 h-5" />,
  },
  {
    id: "leave",
    label: "Leave Management",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    id: "documents",
    label: "Document Vault",
    icon: <FileText className="w-5 h-5" />,
  },
];

function renderPage(page: Page) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "staff":
      return <StaffDirectory />;
    case "roster":
      return <DutyRoster />;
    case "notices":
      return <Notices />;
    case "leave":
      return <LeaveManagement />;
    case "documents":
      return <DocumentVault />;
    default:
      return <Dashboard />;
  }
}

export default function Layout() {
  const { currentPage, setCurrentPage, isAdmin, userRole } = useAppContext();
  const { clear } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <Hospital className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground leading-tight">
            Hospital Portal
          </p>
          <p className="text-xs text-sidebar-foreground/60 capitalize">
            {userRole}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`nav.${item.id}.link`}
            onClick={() => {
              setCurrentPage(item.id);
              setMobileOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              currentPage === item.id
                ? "bg-primary text-white"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <Button
          data-ocid="nav.logout.button"
          variant="ghost"
          onClick={clear}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-60 flex-shrink-0 flex-col"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.22 0.06 240), oklch(0.14 0.05 240))",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          />
          <aside
            className="relative w-60 flex flex-col z-50"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.22 0.06 240), oklch(0.14 0.05 240))",
            }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <Hospital className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Hospital Portal</span>
          </div>
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          {renderPage(currentPage)}
        </main>
      </div>
    </div>
  );
}
