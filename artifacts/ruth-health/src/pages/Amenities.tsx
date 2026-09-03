import { Link } from "wouter";
import {
  X,
  Wifi,
  ParkingCircle,
  ShieldCheck,
  Bell,
  Sparkles,
  Shirt,
  Car,
  PartyPopper,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Badge = "Complimentary" | "Included With Stay" | "Available on Request";

type AmenityItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: Badge;
  note?: string;
};

const BADGE_STYLES: Record<Badge, string> = {
  "Complimentary": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Included With Stay": "bg-amber-50 text-amber-700 border-amber-200",
  "Available on Request": "bg-slate-100 text-slate-600 border-slate-200",
};

const complimentaryAmenities: AmenityItem[] = [
  {
    icon: Wifi,
    title: "Complimentary Wi-Fi",
    description:
      "Stay effortlessly connected with high-speed wireless internet available throughout the property, at no additional cost.",
    badge: "Complimentary",
  },
  {
    icon: ParkingCircle,
    title: "Guest Parking",
    description:
      "Secure, on-site parking is provided for every guest for the full duration of their stay.",
    badge: "Complimentary",
  },
  {
    icon: ShieldCheck,
    title: "24-Hour Security",
    description:
      "Round-the-clock security presence and monitoring, so you can rest with complete peace of mind, day and night.",
    badge: "Complimentary",
  },
];

const includedServices: AmenityItem[] = [
  {
    icon: Bell,
    title: "Guest Assistance",
    description:
      "Our team is on hand around the clock to attend to requests, answer questions, and ensure every stay runs smoothly.",
    badge: "Included With Stay",
  },
  {
    icon: Sparkles,
    title: "Daily Housekeeping",
    description:
      "Thoughtful, discreet housekeeping keeps your room refined and comfortable throughout your visit.",
    badge: "Included With Stay",
  },
];

const onRequestServices: AmenityItem[] = [
  {
    icon: Shirt,
    title: "Laundry & Ironing",
    description:
      "Professional garment care is available on request, so you always step out looking your best.",
    badge: "Available on Request",
    note: "Additional charges may apply",
  },
  {
    icon: Car,
    title: "Transportation Assistance",
    description:
      "Let our team arrange reliable transportation for airport transfers, appointments, or getting around the city.",
    badge: "Available on Request",
    note: "Additional charges may apply",
  },
  {
    icon: PartyPopper,
    title: "Event & Private Functions",
    description:
      "From intimate celebrations to larger gatherings, our staff can help coordinate a memorable private event.",
    badge: "Available on Request",
    note: "Additional charges may apply",
  },
  {
    icon: Briefcase,
    title: "Meeting & Business Services",
    description:
      "Dedicated support for meetings, business travel needs, and professional engagements during your stay.",
    badge: "Available on Request",
    note: "Additional charges may apply",
  },
];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6 md:mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-600/80 mb-1.5">
        {eyebrow}
      </p>
      <h2 className="text-xl md:text-2xl font-serif text-foreground">{title}</h2>
    </div>
  );
}

function AmenityCard({ icon: Icon, title, description, badge, note }: AmenityItem) {
  return (
    <Card className="group h-full border-border bg-card shadow-none hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-6 flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
            <Icon size={20} />
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${BADGE_STYLES[badge]}`}
          >
            {badge}
          </span>
        </div>
        <div>
          <h3 className="font-serif text-base md:text-lg text-foreground mb-1.5">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          {note && (
            <p className="text-[11px] text-muted-foreground/70 italic mt-2">{note}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Amenities() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10 relative">
      <Link
        href="/"
        aria-label="Close"
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={18} />
      </Link>

      {/* Hero */}
      <div className="mb-14 md:mb-20 text-center max-w-2xl mx-auto pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600 mb-3">
          Benington Hotel &amp; Suite
        </p>
        <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-4 leading-tight">
          Amenities &amp; Guest Services
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          Every detail of your stay is considered — from effortless connectivity and
          dependable security to attentive service the moment you need it. Explore the
          amenities and guest services designed around your comfort.
        </p>
      </div>

      {/* Complimentary amenities */}
      <section className="mb-16 md:mb-20">
        <SectionHeading eyebrow="For Every Guest" title="Complimentary Amenities" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {complimentaryAmenities.map((item) => (
            <AmenityCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* Included services */}
      <section className="mb-16 md:mb-20">
        <SectionHeading eyebrow="Part of Your Stay" title="Included Services" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
          {includedServices.map((item) => (
            <AmenityCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* On-request services */}
      <section>
        <SectionHeading eyebrow="Tailored to You" title="On-Request Services" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {onRequestServices.map((item) => (
            <AmenityCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
