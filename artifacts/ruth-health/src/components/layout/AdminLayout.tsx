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
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon size={18} />
        {item.label}
      </Link>
    );
  };

  const NavSectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
      {children}
    </p>
  );

  const NavLinks = () => (
    <nav className="space-y-1 px-3">
      {topNavItems.map((item) => (
        <NavLink key={item.path} item={item} />
      ))}

      <NavSectionLabel>Ruth Health</NavSectionLabel>
      {ruthHealthNavItems.map((item) => (
        <NavLink key={item.path} item={item} />
      ))}

      <NavSectionLabel>Hotel</NavSectionLabel>
      {hotelNavItems.map((item) => (
        <NavLink key={item.path} item={item} />
      ))}
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
