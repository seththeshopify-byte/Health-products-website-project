import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function Navbar() {
  const { isLoggedIn, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem("ruth_health_token");
    queryClient.clear();
    setLocation("/");
  };

  const navItems = [
    { label: "Products", path: "/products" },
    { label: "Services", path: "/services" },
    { label: "Courses", path: "/courses" },
  ];

  const hotelNavItems: { label: string; path?: string }[] = [
    { label: "Rooms & Suites", path: "/rooms" },
    { label: "Food & Drinks", path: "/food" },
    { label: "Amenities", path: "/amenities" },
    { label: "Gallery" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-2">
        {/* ===================== LEFT — WELLNESS / ENTREPRENEUR ===================== */}
        <div className="flex items-center min-w-0 flex-1">
          <Link href="/" className="font-serif text-lg md:text-xl font-semibold text-primary shrink-0">
            Dashboard
          </Link>
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-muted-foreground ml-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "hover:text-primary transition-colors whitespace-nowrap",
                  location.startsWith(item.path) && "text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {isLoggedIn && (
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {isAdmin && (
              <Link href="/admin" className="text-xs font-medium hover:text-primary whitespace-nowrap">
                Admin
              </Link>
            )}
            <Link href="/dashboard" className="text-xs font-medium hover:text-primary whitespace-nowrap">
              Dashboard
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 text-xs">
              Logout
            </Button>
          </div>
        )}

        {/* Divider between the two brand sides */}
        <div className="hidden md:block w-px h-6 bg-border shrink-0" />

        {/* ===================== RIGHT — HOTEL ===================== */}
        <div className="hidden md:flex items-center min-w-0 flex-1">
          <img
            src="/attached_assets/generated_images/RuthHotelLogo.png"
            alt="Benington Hotel & Suite"
            className="h-6 w-auto shrink-0"
          />
          <span className="hidden lg:inline ml-2 font-serif text-xs font-semibold text-amber-700 whitespace-nowrap">
            Benington Hotel &amp; Suite
          </span>
          <nav className="hidden xl:flex items-center gap-4 text-xs font-medium text-muted-foreground ml-5">
            {hotelNavItems.map((item) =>
              item.path ? (
                <Link
                  key={item.label}
                  href={item.path}
                  className={cn(
                    "hover:text-amber-700 transition-colors whitespace-nowrap",
                    location.startsWith(item.path) && "text-amber-700",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className="whitespace-nowrap text-muted-foreground/50">
                  {item.label}
                </span>
              ),
            )}
          </nav>
        </div>

        {/* Single mobile menu trigger for both sides */}
        <button
          className="lg:hidden text-primary shrink-0"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t bg-background p-4 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-4">
            {/* ===== Left column — Wellness ===== */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Wellness
              </p>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isLoggedIn && (
                <>
                  <Link href="/dashboard" className="text-base font-medium" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-base font-medium" onClick={() => setIsOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    className="text-base font-medium text-left text-destructive"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* ===== Right column — Hotel ===== */}
            <div className="flex flex-col gap-3 border-l pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hotel
              </p>
              <div className="flex items-center gap-2">
                <img
                  src="/attached_assets/generated_images/RuthHotelLogo.png"
                  alt="Benington Hotel & Suite"
                  className="h-7 w-auto"
                />
                <span className="font-serif text-sm font-semibold text-amber-700">
                  Benington Hotel &amp; Suite
                </span>
              </div>
              {hotelNavItems.map((item) =>
                item.path ? (
                  <Link
                    key={item.label}
                    href={item.path}
                    className="text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span key={item.label} className="text-base font-medium text-muted-foreground/50">
                    {item.label}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
