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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-2xl font-semibold text-primary">
            Ruth Health.
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "hover:text-primary transition-colors",
                  location.startsWith(item.path) && "text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/book-a-call" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Book Consultation
          </Link>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden text-primary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-4">
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
          <div className="h-px bg-border my-2" />
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
        </div>
      )}
    </header>
  );
}