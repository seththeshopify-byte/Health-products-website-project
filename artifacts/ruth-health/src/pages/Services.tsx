import { Link } from "wouter";
import { useListServices, getListServicesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { formatPrice } from "@/lib/utils";

export default function Services() {
  const { data: services, isLoading } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const { isMember } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mb-12 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Professional Services</h1>
        <p className="text-xl text-muted-foreground">
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
            <Link key={service.id} href={`/services/${service.id}`} className="group block h-full">
              <Card className="h-full border-transparent shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-card border-border">
                <div className="aspect-video bg-muted w-full overflow-hidden relative">
                  <AppImage 
                    src={service.imageUrl || undefined} 
                    fallbackType="consultation"
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {isMember && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="shadow-sm bg-background/80 backdrop-blur-sm border-transparent text-foreground">Member Pricing</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-8 flex flex-col justify-between h-[calc(100%-56.25%)]">
                  <div>
                    <h3 className="font-serif text-2xl mb-3 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-base text-muted-foreground line-clamp-3 mb-6">{service.description}</p>
                  </div>
                  <div className="mt-auto border-t pt-6">
                    {isMember ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Member Rate</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-muted-foreground line-through pb-0.5">{formatPrice(service.guestPrice)}</span>
                          <span className="text-2xl font-medium text-primary">{formatPrice(service.memberPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Consultation Fee</span>
                        <span className="text-2xl font-medium text-foreground">{formatPrice(service.guestPrice)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
