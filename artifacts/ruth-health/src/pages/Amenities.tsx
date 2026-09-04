import { Link } from "wouter";
import { X, Image as ImageIcon } from "lucide-react";
import { useListAmenities, getListAmenitiesQueryKey, type Amenity } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORY_META: Record<string, { eyebrow: string; title: string; badge: string; badgeClass: string }> = {
  complimentary: {
    eyebrow: "For Every Guest",
    title: "Complimentary Amenities",
    badge: "Complimentary",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  included: {
    eyebrow: "Part of Your Stay",
    title: "Included Services",
    badge: "Included With Stay",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "on-request": {
    eyebrow: "Tailored to You",
    title: "On-Request Services",
    badge: "Available on Request",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};
const CATEGORY_ORDER = ["complimentary", "included", "on-request"];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 md:mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-600/80 mb-1.5">
        {eyebrow}
      </p>
      <h2 className="text-xl md:text-2xl font-serif text-foreground">{title}</h2>
    </div>
  );
}

function AmenityCard({ item }: { item: Amenity }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META["on-request"];
  return (
    <Card className="group h-full border-border bg-card shadow-none hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {item.imageUrl ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full flex items-center justify-center bg-amber-50 text-amber-300">
          <ImageIcon size={28} />
        </div>
      )}
      <CardContent className="p-6 flex flex-col gap-3">
        <span
          className={`self-start text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.badgeClass}`}
        >
          {meta.badge}
        </span>
        <div>
          <h3 className="font-serif text-base md:text-lg text-foreground mb-1.5">{item.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          {item.note && (
            <p className="text-[11px] text-muted-foreground/70 italic mt-2">{item.note}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Amenities() {
  const { data: amenities, isLoading } = useListAmenities({ query: { queryKey: getListAmenitiesQueryKey() } });

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: (amenities ?? []).filter((a) => a.category === category),
  })).filter((group) => group.items.length > 0);

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
      <div className="mb-8 md:mb-10 text-center max-w-2xl mx-auto">
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-[4/3] bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          Amenities will appear here once they're added from the admin panel.
        </p>
      ) : (
        grouped.map(({ category, items }) => {
          const meta = CATEGORY_META[category] ?? CATEGORY_META["on-request"];
          return (
            <section key={category} className="mb-12 md:mb-14">
              <SectionHeading eyebrow={meta.eyebrow} title={meta.title} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <AmenityCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
