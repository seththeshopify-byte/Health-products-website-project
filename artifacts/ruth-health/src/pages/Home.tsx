import { Link } from "wouter";
import { ArrowRight, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

export default function Home() {

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-8 pb-10 md:pt-12 md:pb-14 overflow-hidden">
        {/* Signature botanical line-art motif, in place of a generic gradient orb backdrop */}
        <svg
          className="absolute -right-24 top-1/2 -translate-y-1/2 w-[520px] h-[520px] text-primary/[0.06] pointer-events-none hidden md:block"
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

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary mb-4">
              Lagos, Nigeria
            </p>
            <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-6 leading-[1.1] tracking-tight">
              Natural purity.<br/>
              <span className="text-primary italic">Personalized care.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Exclusive pricing on organic wellness products, private consultations, and educational resources designed for your holistic well-being.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/products" className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors gap-2">
                Shop Products <ArrowRight size={18} />
              </Link>
              <Link href="/book-a-call" className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-md border border-input bg-background font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                Book Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Markers */}
      <section className="py-8 md:py-10 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x border-border">
            <div className="flex flex-col items-center justify-center p-4">
              <HeartPulse className="text-secondary mb-3" size={32} />
              <h3 className="font-serif text-xl font-medium mb-2">Curated Products</h3>
              <p className="text-sm text-muted-foreground">Rigorous selection of premium health and wellness supplements.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Sparkles className="text-secondary mb-3" size={32} />
              <h3 className="font-serif text-xl font-medium mb-2">Exclusive Member Pricing</h3>
              <p className="text-sm text-muted-foreground">Members unlock significant savings and earn referral commissions.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <ShieldCheck className="text-secondary mb-3" size={32} />
              <h3 className="font-serif text-xl font-medium mb-2">Wellness Consultations</h3>
              <p className="text-sm text-muted-foreground">Private, dedicated time with wellness experts via Zoom.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
