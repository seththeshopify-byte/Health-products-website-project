import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Clock, CalendarDays, ShieldCheck } from "lucide-react";
import { useGetService, getGetServiceQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { REF_CODE_KEY } from "@/hooks/use-ref-code";

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:id");
  const id = parseInt(params?.id || "0", 10);
  const { isMember } = useAuth();
  const { toast } = useToast();
  
  const { data: service, isLoading } = useGetService(id, { 
    query: { enabled: !!id, queryKey: getGetServiceQueryKey(id) } 
  });
  
  const createOrder = useCreateOrder();

  const handleCheckout = () => {
    createOrder.mutate({
      data: {
        itemType: "service",
        itemId: id,
        promoCodeUsed: localStorage.getItem(REF_CODE_KEY) || undefined,
        shippingAddress: { country: "Nigeria" } // Required by schema but not relevant for digital service
      }
    }, {
      onSuccess: (data) => {
        window.location.href = data.checkoutUrl;
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.error || "Failed to initiate checkout", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  if (!service) return <div className="min-h-[50vh] flex items-center justify-center">Service not found</div>;

  const price = isMember ? service.memberPrice : service.guestPrice;

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <Link href="/services" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Services
      </Link>
      
      <div className="max-w-5xl mx-auto">
        <div className="aspect-[21/9] w-full bg-muted rounded-3xl overflow-hidden relative mb-12">
          <AppImage 
            src={service.imageUrl || undefined} 
            fallbackType="consultation"
            alt={service.name} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-serif mb-6 text-foreground">{service.name}</h1>
              <div className="prose prose-lg prose-neutral max-w-none text-muted-foreground">
                <p>{service.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Video size={24} />
                </div>
                <h3 className="font-medium">Virtual Delivery</h3>
                <p className="text-sm text-muted-foreground">Secure, private Zoom consultation from anywhere.</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Clock size={24} />
                </div>
                <h3 className="font-medium">Dedicated Time</h3>
                <p className="text-sm text-muted-foreground">Unrushed session focused entirely on your goals.</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <CalendarDays size={24} />
                </div>
                <h3 className="font-medium">Flexible Booking</h3>
                <p className="text-sm text-muted-foreground">Choose a time slot that works for your schedule.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-medium mb-6">Consultation Details</h3>
              
              <div className="flex flex-col gap-1 mb-8">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-serif text-primary">{formatPrice(price)}</span>
                </div>
                {isMember ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Member Rate</Badge>
                    <span className="text-sm text-muted-foreground line-through">{formatPrice(service.guestPrice)}</span>
                  </div>
                ) : (
                  <div className="text-sm bg-accent/50 text-accent-foreground px-4 py-3 rounded-md mt-4 flex items-start gap-2">
                    <ShieldCheck size={18} className="text-secondary shrink-0 mt-0.5" />
                    <span>Members save on all consultations. Contact an administrator to access member rates.</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCheckout} 
                disabled={createOrder.isPending}
                className="w-full h-14 text-lg mb-4"
              >
                {createOrder.isPending ? "Processing..." : "Purchase Consultation"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                After purchase, you will receive instructions to book your specific time slot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
