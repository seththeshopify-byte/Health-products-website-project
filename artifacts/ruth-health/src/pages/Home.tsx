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
  Video,
  UserRound,
} from "lucide-react";

const quickLinks = [
  { href: "/products", label: "Shop Products", icon: ShoppingBag },
  { href: "/services", label: "Services", icon: Sparkles },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/book-a-call", label: "Book a Call", icon: CalendarCheck },
  { href: "/testimonials", label: "Testimonials", icon: MessagesSquare },
  { href: "/login", label: "Member Login", icon: UserRound },
];

export default function Home() {

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
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

      {/* Trust Markers */}
      <section className="py-3 md:py-4 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x border-border">
            <div className="flex flex-col items-center justify-center p-1.5">
              <HeartPulse className="text-secondary mb-1" size={18} />
              <h3 className="font-serif text-xs md:text-sm font-medium mb-0.5">Curated Products</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">Rigorous selection of premium health and wellness supplements.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5">
              <Sparkles className="text-secondary mb-1" size={18} />
              <h3 className="font-serif text-xs md:text-sm font-medium mb-0.5">Exclusive Member Pricing</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">Members unlock significant savings and earn referral commissions.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5">
              <ShieldCheck className="text-secondary mb-1" size={18} />
              <h3 className="font-serif text-xs md:text-sm font-medium mb-0.5">Wellness Consultations</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">Private, dedicated time with wellness experts via Zoom.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
