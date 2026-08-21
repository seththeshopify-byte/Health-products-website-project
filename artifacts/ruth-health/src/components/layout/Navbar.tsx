import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
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
    { label: "Testimonials & Events", path: "/testimonials" },
  ];

  // Hotel nav — pages don't exist yet, so these are non-navigating
  // placeholders until the hotel section is built out (Phase 2).
  const hotelNavItems = ["Rooms & Suites", "Book a Stay", "Amenities"];
  const hotelNavItemsMobile = ["Rooms & Suites", "Book a Stay", "Amenities", "Gallery", "Contact"];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-2">
        {/* ===================== LEFT — WELLNESS / ENTREPRENEUR ===================== */}
        <div className="flex items-center min-w-0 flex-1">
          <Link href="/" className="font-serif text-xl md:text-2xl font-semibold text-primary shrink-0">
            Dashboard
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground ml-6">
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

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Link href="/book-a-call" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Book Consultation
          </Link>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary whitespace-nowrap">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary whitespace-nowrap">
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:text-primary whitespace-nowrap">
              Sign In
            </Link>
          )}
        </div>

        {/* Divider between the two brand sides */}
        <div className="hidden md:block w-px h-8 bg-border shrink-0" />

        {/* ===================== RIGHT — HOTEL ===================== */}
        <div className="hidden md:flex items-center min-w-0 flex-1">
          <img
            src="/attached_assets/generated_images/RuthHotelLogo.png"
            alt="Benington Hotel & Suite"
            className="h-7 w-auto shrink-0"
          />
          <span className="hidden lg:inline ml-2 font-serif text-sm font-semibold text-amber-700 whitespace-nowrap">
            Benington Hotel &amp; Suite
          </span>
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-muted-foreground ml-6">
            {hotelNavItems.map((label) => (
              <span key={label} className="whitespace-nowrap opacity-60 cursor-default" title="Coming soon">
                {label}
              </span>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <a href="tel:07075787516" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Call Hotel
          </a>
        </div>

        {/* Single mobile menu trigger for both sides */}
        <button
          className="lg:hidden text-primary shrink-0"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wellness</p>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="text-lg font-medium"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/book-a-call"
            className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
            onClick={() => setIsOpen(false)}
          >
            Book Consultation
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                  Admin
                </Link>
              )}
              <button
                className="text-lg font-medium text-left text-destructive"
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
              Sign In
            </Link>
          )}

          <div className="h-px bg-border my-2" />

          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hotel</p>
          <div className="flex items-center gap-2">
            <img
              src="/attached_assets/generated_images/RuthHotelLogo.png"
              alt="Benington Hotel & Suite"
              className="h-8 w-auto"
            />
            <span className="font-serif text-base font-semibold text-amber-700">
              Benington Hotel &amp; Suite
            </span>
          </div>
          {hotelNavItemsMobile.map((label) => (
            <span key={label} className="text-lg font-medium opacity-60" title="Coming soon">
              {label}
            </span>
          ))}
          <a
            href="tel:07075787516"
            className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
            onClick={() => setIsOpen(false)}
          >
            Call Hotel
          </a>
        </div>
      )}
    </header>
  );
}
