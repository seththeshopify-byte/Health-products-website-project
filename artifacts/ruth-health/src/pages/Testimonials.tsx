import { useState } from "react";
import {
  useListTestimonials,
  getListTestimonialsQueryKey,
  useListEvents,
  getListEventsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar, MapPin, Users, Heart, BriefcaseBusiness, ArrowUpRight } from "lucide-react";

type TabKey = "productUsers" | "businessSuccess" | "companyEvents";
type EventTab = "upcoming" | "past";

const TABS: { key: TabKey; label: string; description: string; icon: typeof Heart }[] = [
  {
    key: "productUsers",
    label: "Product Users",
    description: "Real wellness journeys from customers who chose Ruth Health.",
    icon: Heart,
  },
  {
    key: "businessSuccess",
    label: "Business Success Stories",
    description: "See how members are building confidence, community, and opportunity.",
    icon: BriefcaseBusiness,
  },
  {
    key: "companyEvents",
    label: "Company Events",
    description: "Stay connected to the gatherings, trainings, and moments that move us forward.",
    icon: Users,
  },
];

export default function Testimonials() {
  const [activeTab, setActiveTab] = useState<TabKey>("productUsers");
  const [eventTab, setEventTab] = useState<EventTab>("upcoming");

  const { data: productTestimonials, isLoading: loadingProduct } = useListTestimonials({ category: "product" }, {
    query: { queryKey: getListTestimonialsQueryKey({ category: "product" }) },
  });
  const { data: businessTestimonials, isLoading: loadingBusiness } = useListTestimonials({ category: "business" }, {
    query: { queryKey: getListTestimonialsQueryKey({ category: "business" }) },
  });
  const { data: events, isLoading: loadingEvents } = useListEvents({
    query: { queryKey: getListEventsQueryKey() },
  });

  const now = new Date();
  const upcoming = (events || [])
    .filter((event) => new Date(event.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const past = (events || [])
    .filter((event) => new Date(event.eventDate) < now)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  const currentTab = TABS.find((tab) => tab.key === activeTab) || TABS[0];
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="relative mx-auto mb-12 max-w-4xl overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-12 text-center md:px-12">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <p className="relative mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          The Ruth Health Community
        </p>
        <h1 className="relative mb-5 font-serif text-4xl md:text-6xl">Testimonials & Events</h1>
        <p className="relative mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Discover the people, progress, and shared experiences behind the Ruth Health journey.
        </p>
      </div>

      <div className="mx-auto mb-10 grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group rounded-2xl border p-5 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                  : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/30"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? "bg-primary-foreground/15" : "bg-primary/10"
                }`}>
                  <Icon size={19} />
                </span>
                <ArrowUpRight size={18} className={isActive ? "opacity-80" : "text-muted-foreground"} />
              </div>
              <div className="font-serif text-xl">{tab.label}</div>
              <p className={`mt-2 text-sm leading-relaxed ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Explore the stories</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">{currentTab.label}</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-right">
            {currentTab.description}
          </p>
        </div>

        {activeTab === "productUsers" && (
          <TestimonialGrid testimonials={productTestimonials} isLoading={loadingProduct} />
        )}

        {activeTab === "businessSuccess" && (
          <TestimonialGrid testimonials={businessTestimonials} isLoading={loadingBusiness} />
        )}

        {activeTab === "companyEvents" && (
          <>
            <div className="mb-8 flex w-fit rounded-full border bg-card p-1">
              {(["upcoming", "past"] as EventTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setEventTab(tab)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    eventTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "upcoming" ? "Upcoming Events" : "Past Events"}
                </button>
              ))}
            </div>
            <EventGrid
              events={eventTab === "upcoming" ? upcoming : past}
              isLoading={loadingEvents}
              formatDate={formatDate}
              emptyMessage={eventTab === "upcoming" ? "No upcoming events yet. Check back soon." : "No past events to show yet."}
            />
          </>
        )}
      </div>
    </div>
  );
}

function TestimonialGrid({ testimonials, isLoading }: { testimonials: any[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-[250px] w-full animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">No stories yet. Check back soon.</p>;
  }

  return (
    <div className="columns-1 gap-8 space-y-8 pb-12 md:columns-2 lg:columns-3">
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="break-inside-avoid">
          <Card className="overflow-hidden border-border/50 bg-card/70 shadow-sm transition-all hover:-translate-y-1 hover:bg-card hover:shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6 flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" />)}
              </div>
              <p className="mb-8 text-lg leading-relaxed text-foreground italic">“{testimonial.text}”</p>
              <MediaGallery
                imageUrls={(testimonial.photoUrls?.length ? testimonial.photoUrls : testimonial.photoUrl ? [testimonial.photoUrl] : []).slice(1)}
                videoUrls={testimonial.videoUrls?.length ? testimonial.videoUrls : testimonial.videoUrl ? [testimonial.videoUrl] : []}
                alt={testimonial.name}
              />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent shadow-sm">
                  {testimonial.photoUrl ? (
                    <img src={testimonial.photoUrl} alt={testimonial.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-serif text-lg text-muted-foreground">{testimonial.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="text-base font-medium">{testimonial.name}</div>
                  <div className="text-sm font-medium text-secondary">Verified Ruth Health Member</div>
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
      <div className="grid grid-cols-1 gap-8 pb-12 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-[350px] w-full animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 pb-12 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden border-border/50 bg-card/70 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="aspect-video overflow-hidden bg-muted">
            {(event.imageUrls?.[0] || event.imageUrl) ? (
              <img src={event.imageUrls?.[0] || event.imageUrl} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Calendar size={40} /></div>
            )}
          </div>
          <CardContent className="p-6">
            <h3 className="mb-3 font-serif text-xl">{event.title}</h3>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={16} className="text-primary" /><span>{formatDate(event.eventDate)}</span>
            </div>
            {event.location && (
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className="text-primary" /><span>{event.location}</span>
              </div>
            )}
            {event.description && <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>}
            <MediaGallery
              imageUrls={(event.imageUrls?.length ? event.imageUrls : event.imageUrl ? [event.imageUrl] : []).slice(1)}
              videoUrls={event.videoUrls || []}
              alt={event.title}
              compact
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MediaGallery({
  imageUrls,
  videoUrls,
  alt,
  compact = false,
}: {
  imageUrls: string[];
  videoUrls: string[];
  alt: string;
  compact?: boolean;
}) {
  if (!imageUrls.length && !videoUrls.length) return null;
  return (
    <div className={`grid gap-3 ${compact ? "mt-5 grid-cols-2" : "mb-7 grid-cols-2"}`}>
      {imageUrls.map((url, index) => (
        <img
          key={`image-${url}-${index}`}
          src={url}
          alt={`${alt} photo ${index + 1}`}
          className="aspect-square w-full rounded-xl border object-cover"
        />
      ))}
      {videoUrls.map((url, index) => (
        <video
          key={`video-${url}-${index}`}
          src={url}
          controls
          preload="metadata"
          className="aspect-video w-full rounded-xl bg-black object-contain"
        />
      ))}
    </div>
  );
}
