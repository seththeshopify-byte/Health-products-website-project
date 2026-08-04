import { useState } from "react";
import {
  useListTestimonials,
  getListTestimonialsQueryKey,
  useListEvents,
  getListEventsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar, MapPin, Users, Heart, BriefcaseBusiness, ArrowUpRight, X } from "lucide-react";

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
    <div className="container mx-auto px-4 py-4 md:py-6">
      <div className="mx-auto mb-4 max-w-3xl text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          The Ruth Health Community
        </p>
        <h1 className="font-serif text-2xl md:text-3xl">Testimonials & Events</h1>
      </div>

      <div className="mx-auto mb-6 grid max-w-5xl grid-cols-1 gap-2 md:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isActive ? "bg-primary-foreground/15" : "bg-primary/10"
              }`}>
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-sm leading-tight">{tab.label}</div>
              </div>
              <ArrowUpRight size={14} className={`shrink-0 ${isActive ? "opacity-80" : "text-muted-foreground"}`} />
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-6xl">
        {activeTab === "productUsers" && (
          <TestimonialGrid testimonials={productTestimonials} isLoading={loadingProduct} />
        )}

        {activeTab === "businessSuccess" && (
          <TestimonialGrid testimonials={businessTestimonials} isLoading={loadingBusiness} />
        )}

        {activeTab === "companyEvents" && (
          <>
            <div className="mb-4 flex w-fit rounded-full border bg-card p-1">
              {(["upcoming", "past"] as EventTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setEventTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
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

// Strips HTML tags/entities down to plain readable text, used for the short card
// preview so a card's height never depends on how much markup the full testimonial has.
function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function TestimonialGrid({ testimonials, isLoading }: { testimonials: any[] | undefined; isLoading: boolean }) {
  const [expanded, setExpanded] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 pb-12 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-64 w-full animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">No stories yet. Check back soon.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 pb-12 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => {
          const preview = stripHtml(testimonial.text);
          return (
            <Card
              key={testimonial.id}
              className="flex h-64 flex-col overflow-hidden border-border/50 bg-card/70 shadow-sm transition-all hover:-translate-y-1 hover:bg-card hover:shadow-lg"
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-3 flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill="currentColor" />)}
                </div>
                <p className="mb-3 flex-1 overflow-hidden text-sm leading-relaxed text-foreground line-clamp-4">
                  {preview}
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded(testimonial)}
                  className="mb-4 self-start text-sm font-medium text-primary hover:underline"
                >
                  Read more
                </button>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent shadow-sm">
                    {testimonial.photoUrl ? (
                      <img src={testimonial.photoUrl} alt={testimonial.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-serif text-base text-muted-foreground">{testimonial.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{testimonial.name}</div>
                    <div className="text-xs font-medium text-secondary">Verified Ruth Health Member</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setExpanded(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-8 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setExpanded(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
            >
              <X size={18} />
            </button>
            <div className="mb-6 flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" />)}
            </div>
            <div
              className="prose prose-sm mb-8 max-w-none text-foreground [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: expanded.text }}
            />
            <MediaGallery
              imageUrls={(expanded.photoUrls?.length ? expanded.photoUrls : expanded.photoUrl ? [expanded.photoUrl] : []).slice(1)}
              videoUrls={expanded.videoUrls?.length ? expanded.videoUrls : expanded.videoUrl ? [expanded.videoUrl] : []}
              alt={expanded.name}
            />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent shadow-sm">
                {expanded.photoUrl ? (
                  <img src={expanded.photoUrl} alt={expanded.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-serif text-lg text-muted-foreground">{expanded.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="text-base font-medium">{expanded.name}</div>
                <div className="text-sm font-medium text-secondary">Verified Ruth Health Member</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Splits a chunk of rich HTML (e.g. the "Event Highlights", "Featured Speakers", "Why
// You Should Attend" boxes) into its separate top-level blocks, so a two-column layout
// can distribute each box evenly instead of treating the whole description as one piece.
function splitHtmlIntoBlocks(html: string): string[] {
  if (typeof document === "undefined" || !html) return html ? [html] : [];
  const container = document.createElement("div");
  container.innerHTML = html;
  const blocks = Array.from(container.children).map((child) => child.outerHTML);
  return blocks.length > 0 ? blocks : [html];
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        {[1, 2, 3].map((item) => <div key={item} className="h-[350px] w-full animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-8 pb-12">
      {events.map((event) => {
        const allImages: string[] = event.imageUrls?.length
          ? event.imageUrls
          : event.imageUrl
          ? [event.imageUrl]
          : [];

        return (
          <Card
            key={event.id}
            className="overflow-hidden border-border/50 bg-card/70 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="p-8">
              {/* Title / date / location stay full-width at the top, aligned consistently */}
              <h3 className="mb-3 font-serif text-xl">{event.title}</h3>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={16} className="text-primary" /><span>{formatDate(event.eventDate)}</span>
              </div>
              {event.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 flex items-center gap-2 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-primary"
                >
                  <MapPin size={16} className="text-primary" /><span>{event.location}</span>
                </a>
              )}

              {(() => {
                const descBlocks = event.description ? splitHtmlIntoBlocks(event.description) : [];
                let blockCursor = 0;
                const takeNextBlock = () => (blockCursor < descBlocks.length ? descBlocks[blockCursor++] : null);
                const renderBlock = (html: string, key: string) => (
                  <div
                    key={key}
                    className="text-sm leading-relaxed text-muted-foreground [&_h2]:font-serif [&_h2]:text-lg [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-base [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );

                const gridItems: { key: string; node: React.ReactNode }[] = [];

                // Each image/video is bundled with the text block that comes right after it,
                // so that trailing text fills the space below the media instead of leaving it blank.
                allImages.forEach((url, index) => {
                  const extra = takeNextBlock();
                  gridItems.push({
                    key: `img-${index}`,
                    node: (
                      <div className="flex h-full flex-col gap-4">
                        <img
                          src={url}
                          alt={`${event.title} photo ${index + 1}`}
                          onClick={() => setLightboxUrl(url)}
                          className="w-full cursor-zoom-in rounded-xl border border-border/50 bg-muted object-contain transition-opacity hover:opacity-90"
                        />
                        {extra && renderBlock(extra, `img-${index}-extra`)}
                      </div>
                    ),
                  });
                });

                (event.videoUrls || []).forEach((url: string, index: number) => {
                  const extra = takeNextBlock();
                  gridItems.push({
                    key: `vid-${index}`,
                    node: (
                      <div className="flex h-full flex-col gap-4">
                        <video src={url} controls preload="metadata" className="w-full rounded-xl bg-black object-contain" />
                        {extra && renderBlock(extra, `vid-${index}-extra`)}
                      </div>
                    ),
                  });
                });

                // Any remaining, unattached text blocks continue as their own standalone cells.
                while (blockCursor < descBlocks.length) {
                  const html = descBlocks[blockCursor];
                  gridItems.push({ key: `desc-${blockCursor}`, node: renderBlock(html, `desc-${blockCursor}`) });
                  blockCursor++;
                }

                return (
                  /*
                    Real grid, not free-flowing columns: each row's left and right items
                    stretch to match the taller one, so every row's top edges and bottom
                    edges line up horizontally — including the very last row. Media cells
                    carry their own trailing text so the space below a shorter image/video
                    is put to use instead of sitting empty.
                  */
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {gridItems.map((item) => (
                      <div key={item.key} className="flex h-full">
                        {item.node}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        );
      })}

      {/* Lightbox overlay for event photos, matching the testimonial photo lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}

function VideoGallery({ videoUrls }: { videoUrls: string[] }) {
  if (!videoUrls.length) return null;
  return (
    <div className="mt-5 space-y-3">
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!imageUrls.length && !videoUrls.length) return null;

  const singlePhoto = imageUrls.length === 1;
  const photoHeightClass = singlePhoto ? "h-64 sm:h-80" : compact ? "h-28" : "h-40";

  return (
    <div className={`space-y-3 ${compact ? "mt-5" : "mb-7"}`}>
      {videoUrls.map((url, index) => (
        <video
          key={`video-${url}-${index}`}
          src={url}
          controls
          preload="metadata"
          className="aspect-video w-full rounded-xl bg-black object-contain"
        />
      ))}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, index) => (
            <img
              key={`image-${url}-${index}`}
              src={url}
              alt={`${alt} photo ${index + 1}`}
              onClick={() => setLightboxUrl(url)}
              className={`w-auto cursor-pointer rounded-xl border bg-muted object-contain transition-opacity hover:opacity-90 ${photoHeightClass} ${singlePhoto ? "max-w-full" : ""}`}
            />
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
