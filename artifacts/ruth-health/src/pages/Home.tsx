import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  ShoppingBag,
  CalendarCheck,
  GraduationCap,
  MessagesSquare,
  UserRound,
  X,
} from "lucide-react";

const quickLinks = [
  { href: "/products", label: "Shop Products", icon: ShoppingBag },
  { href: "/services", label: "Services", icon: Sparkles },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/book-a-call", label: "Book a Call", icon: CalendarCheck },
  { href: "/testimonials", label: "Testimonials", icon: MessagesSquare },
  { href: "/login", label: "Member Login", icon: UserRound },
];

const trustMarkers = [
  {
    id: "curated-products",
    icon: HeartPulse,
    title: "Curated Products",
    description: "Rigorous selection of premium health and wellness supplements.",
  },
  {
    id: "member-pricing",
    icon: Sparkles,
    title: "Exclusive Member Pricing",
    description: "Members unlock significant savings and earn referral commissions.",
  },
  {
    id: "wellness-consultations",
    icon: ShieldCheck,
    title: "Wellness Consultations",
    description: "Private, dedicated time with wellness experts via Zoom.",
  },
];

export default function Home() {
  const [openMarker, setOpenMarker] = useState<string | null>(null);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Signature botanical line-art motif, in place of a generic gradient orb backdrop */}
        <svg
          className="absolute -right-24 top-1/2 -translate-y-1/2 w-[420px] h-[420px] text-primary/[0.06] pointer-events-none hidden lg:block"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M100 190 C100 140, 95 110, 100 10" />
          <path d="M100 150 C130 140, 150 120, 165 90" />
          <path d="M100 150 C70 140, 50 120, 35 90" />
          <path d="M100 110 C125 102, 140 85, 150 60" />
          <path d="M100 110 C75 102, 60 85, 50 60" />
          <path d="M100 70 C118 62, 128 48, 133 30" />
          <path d="M100 70 C82 62, 72 48, 67 30" />
          <circle cx="100" cy="14" r="4" />
        </svg>

        <div className="container mx-auto px-4 relative z-10 py-4 md:py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.55fr_1fr] gap-6 lg:gap-6 items-center">
            {/* Left: heading + copy + primary actions */}
            <div className="text-center lg:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary mb-2">
                Lagos, Nigeria
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-foreground mb-2 leading-[1.08] tracking-tight">
                Natural purity.<br/>
                <span className="text-primary italic">Personalized care.</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Exclusive pricing on organic wellness products, private consultations, and educational resources designed for your holistic well-being.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2">
                <Link href="/products" className="w-full sm:w-auto inline-flex items-center justify-center h-9 px-5 rounded-md bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors gap-2">
                  Shop Products <ArrowRight size={14} />
                </Link>
                <Link href="/book-a-call" className="w-full sm:w-auto inline-flex items-center justify-center h-9 px-5 rounded-md border border-input bg-background text-xs md:text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  Book Consultation
                </Link>
              </div>
            </div>

            {/* Middle: click-to-reveal trust markers */}
            <div className="flex flex-row lg:flex-col items-center lg:items-start justify-center gap-2 lg:gap-2.5">
              {trustMarkers.map(({ id, icon: Icon, title, description }) => (
                <div key={id} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMarker(openMarker === id ? null : id)}
                    aria-expanded={openMarker === id}
                    className="group flex items-center gap-2 rounded-full border border-border bg-card/70 pl-2 pr-3 py-1.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon size={14} />
                    </span>
                    <span className="hidden sm:inline text-[11px] font-medium leading-tight text-foreground text-left">
                      {title}
                    </span>
                  </button>

                  {openMarker === id && (
                    <div className="absolute z-20 w-56 rounded-lg border border-border bg-popover p-3 shadow-lg top-full mt-2 left-1/2 -translate-x-1/2 lg:left-full lg:top-0 lg:mt-0 lg:ml-2 lg:translate-x-0">
                      <button
                        type="button"
                        onClick={() => setOpenMarker(null)}
                        aria-label="Close"
                        className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                      <h4 className="font-serif text-xs font-medium mb-1 pr-4 text-foreground">
                        {title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right: quick-access tile grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col items-center justify-center gap-1.5 h-20 md:h-24 rounded-xl border border-border bg-card/70 shadow-sm px-1.5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md"
                >
                  <span className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={14} />
                  </span>
                  <span className="text-[10px] md:text-[11px] font-medium leading-tight text-foreground">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
