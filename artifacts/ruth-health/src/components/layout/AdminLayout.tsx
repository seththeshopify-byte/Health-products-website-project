import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Stethoscope,
  GraduationCap,
  MessageSquareQuote,
  Users,
  CalendarDays,
  Coins,
  Truck,
  ArrowLeft,
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAdmin) setLocation("/login");
  }, [isLoading, isAdmin, setLocation]);

  if (isLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const navItems = [
    { label: "Overview", path: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Products", path: "/admin/products", icon: Package },
    { label: "Services", path: "/admin/services", icon: Stethoscope },
    { label: "Courses", path: "/admin/courses", icon: GraduationCap },
    { label: "Testimonials & Events", path: "/admin/testimonials", icon: MessageSquareQuote },
    { label: "Members", path: "/admin/users", icon: Users },
    { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
    { label: "Commissions", path: "/admin/commission", icon: Coins },
    { label: "Shipping", path: "/admin/shipping", icon: Truck },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border bg-sidebar-primary px-6 text-sidebar-primary-foreground">
          <span className="font-serif text-xl font-medium">Admin Portal</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = item.exact ? location === item.path : location.startsWith(item.path);
              return (
                <Link
                  key={item.path}
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
            })}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-sidebar-foreground transition-colors hover:text-primary">
            <ArrowLeft size={16} /> Back to Site
          </Link>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
          <span className="font-serif text-lg font-medium">Admin Portal</span>
          <Link href="/" className="text-sm text-muted-foreground">Exit</Link>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}