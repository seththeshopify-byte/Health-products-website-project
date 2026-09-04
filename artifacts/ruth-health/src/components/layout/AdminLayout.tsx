import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  Stethoscope,
  GraduationCap,
  DoorOpen,
  MessageSquareQuote,
  Users,
  CalendarDays,
  Coins,
  Truck,
  ArrowLeft,
  Menu,
  UtensilsCrossed,
  Sparkles,
  X,
} from "lucide-react";
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    if (!isLoading && !isAdmin) setLocation("/login");
  }, [isLoading, isAdmin, setLocation]);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);
  if (isLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const topNavItems = [
    { label: "Overview", path: "/admin", icon: LayoutDashboard, exact: true },
  ];

  const ruthHealthNavItems = [
    { label: "Products", path: "/admin/products", icon: Package },
    { label: "Services", path: "/admin/services", icon: Stethoscope },
    { label: "Courses", path: "/admin/courses", icon: GraduationCap },
    { label: "Testimonials & Events", path: "/admin/testimonials", icon: MessageSquareQuote },
    { label: "Company Events", path: "/admin/events", icon: CalendarDays },
    { label: "Members", path: "/admin/users", icon: Users },
    { label: "Commissions", path: "/admin/commission", icon: Coins },
    { label: "Shipping", path: "/admin/shipping", icon: Truck },
  ];

  const hotelNavItems = [
    { label: "Rooms", path: "/admin/rooms", icon: DoorOpen },
    { label: "Amenities", path: "/admin/amenities", icon: Sparkles },
    { label: "Food & Drinks", path: "/admin/menu-items", icon: UtensilsCrossed },
    { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
  ];

  const isItemActive = (item: { path: string; exact?: boolean }) =>
    item.exact ? location === item.path : location.startsWith(item.path);

  const NavLink = ({ item }: { item: { label: string; path: string; icon: any; exact?: boolean } }) => {
    const isActive = isItemActive(item);
    return (
      <Link
        href={item.path}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon size={18} className="shrink-0" />
        <span className="leading-tight">{item.label}</span>
      </Link>
    );
  };

  const NavSectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="px-2 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
      {children}
    </p>
  );

  const NavLinks = () => (
    <nav className="space-y-1 px-3">
      {topNavItems.map((item) => (
        <NavLink key={item.path} item={item} />
      ))}

      {/* Ruth Health (left column) / Hotel (right column) side by side,
          on both the desktop sidebar and the mobile sheet since both
          render this same NavLinks component. */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <NavSectionLabel>Ruth Health</NavSectionLabel>
          <div className="space-y-1">
            {ruthHealthNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        </div>

        <div className="border-l border-sidebar-border pl-2">
          <NavSectionLabel>Hotel</NavSectionLabel>
          <div className="space-y-1">
            {hotelNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border bg-sidebar-primary px-6 text-sidebar-primary-foreground">
          <span className="font-serif text-xl font-medium">Admin Portal</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border p-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-sidebar-foreground transition-colors hover:text-primary">
            <ArrowLeft size={16} /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile slide-out navigation */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="h-16 justify-center border-b border-sidebar-border bg-sidebar-primary px-6 text-left">
            <SheetTitle className="font-serif text-xl font-medium text-sidebar-primary-foreground">
              Admin Portal
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <NavLinks />
          </div>
          <div className="border-t border-sidebar-border p-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-sidebar-foreground transition-colors hover:text-primary">
              <ArrowLeft size={16} /> Back to Site
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open admin menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent"
          >
            <Menu size={20} />
          </button>
          <span className="font-serif text-lg font-medium">Admin Portal</span>
          <Link href="/" className="text-sm text-muted-foreground">Exit</Link>
        </header>
        <Link
          href="/"
          aria-label="Close"
          className="hidden md:flex absolute top-4 right-4 z-40 h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={18} />
        </Link>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
