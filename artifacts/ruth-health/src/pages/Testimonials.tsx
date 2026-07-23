import { useState } from "react";
import { useListTestimonials, getListTestimonialsQueryKey, useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar, MapPin } from "lucide-react";

type TabKey = "productWins" | "businessWins" | "upcomingEvents" | "pastEvents";

const TABS: { key: TabKey; label: string }[] = [
  { key: "productWins", label: "Products Results" },
  { key: "businessWins", label: "Business Success Stories" },
  { key: "upcomingEvents", label: "Upcoming Events" },
  { key: "pastEvents", label: "Past Events" },
];

export default function Testimonials() {
  const [activeTab, setActiveTab] = useState<TabKey>("productWins");

  const { data: productTestimonials, isLoading: loadingProduct } = useListTestimonials("product", {
    query: { queryKey: getListTestimonialsQueryKey("product") },
  });
  const { data: businessTestimonials, isLoading: loadingBusiness } = useListTestimonials("business", {
    query: { queryKey: getListTestimonialsQueryKey("business") },
  });
  const { data: events, isLoading: loadingEvents } = useListEvents({
    query: { queryKey: getListEventsQueryKey() },
  });

  const now = new Date();
  const upcoming = (events || [])
    .filter(e => new Date(e.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const past = (events || [])
    .filter(e => new Date(e.eventDate) < now)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif mb-6">Testimonials & Events</h1>
        <p className="text-xl text-muted-foreground">
          Real stories from our community, and the events bringing us together.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Results */}
      {activeTab === "productWins" && (
        <TestimonialGrid testimonials={productTestimonials} isLoading={loadingProduct} />
      )}

      {/* Business Success Stories */}
      {activeTab === "businessWins" && (
        <TestimonialGrid testimonials={businessTestimonials} isLoading={loadingBusiness} />
      )}

      {/* Upcoming Events */}
      {activeTab === "upcomingEvents" && (
        <EventGrid events={upcoming} isLoading={loadingEvents} formatDate={formatDate} emptyMessage="No upcoming events yet. Check back soon." />
      )}

      {/* Past Events */}
      {activeTab === "pastEvents" && (
        <EventGrid events={past} isLoading={loadingEvents} formatDate={formatDate} emptyMessage="No past events to show yet." />
      )}
    </div>
  );
}

function TestimonialGrid({ testimonials, isLoading }: { testimonials: any[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse bg-muted rounded-2xl h-[250px] w-full" />
        ))}
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return <p className="text-center text-muted-foreground py-12">No testimonials yet. Check back soon.</p>;
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 pb-12">
      {testimonials.map(testimonial => (
        <div key={testimonial.id} className="break-inside-avoid">
          <Card className="border-border/50 bg-card/50 hover:bg-card transition-colors shadow-sm">
            <CardContent className="p-8">
              <div className="flex text-amber-400 mb-6">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <p className="text-foreground italic mb-8 leading-relaxed text-lg">"{testimonial.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-border">
                  {testimonial.photoUrl ? (
                    <img src={testimonial.photoUrl} alt={testimonial.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-lg text-muted-foreground">{testimonial.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-base">{testimonial.name}</div>
                  <div className="text-sm font-medium text-secondary">Verified Member</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function EventGrid({
  events,
  isLoading,
  formatDate,
  emptyMessage,
}: {
  events: any[];
  isLoading: boolean;
  formatDate: (iso: string) => string;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-muted rounded-2xl h-[350px] w-full" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <p className="text-center text-muted-foreground py-12">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
      {events.map(event => (
        <Card key={event.id} className="border-border/50 bg-card/50 hover:bg-card transition-colors shadow-sm overflow-hidden">
          <div className="aspect-video bg-muted overflow-hidden">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Calendar size={40} />
              </div>
            )}
          </div>
          <CardContent className="p-6">
            <h3 className="text-xl font-serif mb-3">{event.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar size={16} className="text-primary" />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin size={16} className="text-primary" />
                <span>{event.location}</span>
              </div>
            )}
            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
