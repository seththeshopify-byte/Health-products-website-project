import { useState } from "react";
import { Link } from "wouter";
import { useListServices, getListServicesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { formatPrice } from "@/lib/utils";
import { X } from "lucide-react";

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function Services() {
  const { data: services, isLoading } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const { isMember } = useAuth();
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="mb-12 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-serif mb-2 text-foreground">Professional Services</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Dedicated, one-on-one virtual consultations with our wellness experts. 
          Receive personalized guidance tailored to your unique health profile.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-4">
              <div className="bg-muted aspect-video rounded-xl" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services?.map(service => (
            <button
              key={service.id}
              type="button"
              onClick={() => setSelected(service)}
              className="group block h-full text-left"
            >
              <Card className="h-full border-transparent shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-card border-border">
                <div className="aspect-video bg-muted w-full overflow-hidden relative">
                  <AppImage 
                    src={service.imageUrl || undefined} 
                    fallbackType="consultation"
                    alt={service.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                  />
                  {isMember && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="shadow-sm bg-background/80 backdrop-blur-sm border-transparent text-foreground">Member Pricing</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 flex flex-col justify-between h-[calc(100%-56.25%)]">
                  <div>
                    <h3 className="font-serif text-lg mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{stripHtml(service.description)}</p>
                  </div>
                  <div className="mt-auto border-t pt-4">
                    {isMember ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Member Rate</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-muted-foreground line-through pb-0.5">{formatPrice(service.guestPrice)}</span>
                          <span className="text-xl font-medium text-primary">{formatPrice(service.memberPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Consultation Fee</span>
                        <span className="text-xl font-medium text-foreground">{formatPrice(service.guestPrice)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              <X size={18} />
            </button>

            <div className="aspect-video w-full overflow-hidden bg-muted relative">
              <AppImage
                src={selected.imageUrl || undefined}
                fallbackType="consultation"
                alt={selected.name}
                className="w-full h-full object-contain"
              />
              {isMember && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="shadow-sm bg-background/80 backdrop-blur-sm border-transparent text-foreground">Member Pricing</Badge>
                </div>
              )}
            </div>

            <div className="p-8">
              <h3 className="font-serif text-2xl mb-4">{selected.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-6 whitespace-pre-line">
                {stripHtml(selected.description)}
              </p>

              <div className="border-t pt-4 mb-6">
                {isMember ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Member Rate</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground line-through pb-0.5">{formatPrice(selected.guestPrice)}</span>
                      <span className="text-xl font-medium text-primary">{formatPrice(selected.memberPrice)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Consultation Fee</span>
                    <span className="text-xl font-medium text-foreground">{formatPrice(selected.guestPrice)}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/services/${selected.id}`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View Full Details & Book
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
