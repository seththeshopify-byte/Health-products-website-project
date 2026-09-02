import { useGetRoom, getGetRoomQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import { formatPrice } from "@/lib/utils";
import { REF_CODE_KEY } from "@/hooks/use-ref-code";
import { ArrowLeft, ShieldCheck, Calendar, Users, Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RoomDetail() {
  const [, params] = useRoute("/rooms/:id");
  const id = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: room, isLoading } = useGetRoom(id, { 
    query: { enabled: !!id, queryKey: getGetRoomQueryKey(id) } 
  });

  const createOrder = useCreateOrder();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nights, setNights] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "counter">("online");
  const [isPayAtCounterPending, setIsPayAtCounterPending] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Nigeria"
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const perNightPrice = room?.guestPrice || 0;
  const totalPrice = perNightPrice * nights;
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleCheckout = async () => {
    if (!email || !isValidEmail(email)) {
      toast({ title: "Required", description: "A valid email is required to receive your booking confirmation", variant: "destructive" });
      return;
    }

    if (paymentMethod === "counter") {
      setIsPayAtCounterPending(true);
      try {
        const res = await fetch("/api/orders/room/pay-at-counter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id, nights, email, phone: phone || undefined })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to submit booking");
        toast({ title: "Booking received", description: "We'll confirm your room and you'll pay at the counter on arrival." });
        setIsCheckoutOpen(false);
        setLocation("/rooms");
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to submit booking", variant: "destructive" });
      } finally {
        setIsPayAtCounterPending(false);
      }
      return;
    }

    if (!shippingAddress.country) {
      toast({ title: "Required", description: "Country is required", variant: "destructive" });
      return;
    }
    createOrder.mutate({
      data: {
        itemType: "room",
        itemId: id,
        nights,
        promoCodeUsed: localStorage.getItem(REF_CODE_KEY) || undefined,
        shippingAddress,
        email
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
  if (!room) return <div className="min-h-[50vh] flex items-center justify-center">Room not found</div>;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <Link href="/rooms" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Wellness Rooms
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        <div className="space-y-6">
          <div className="aspect-square max-w-[480px] mx-auto md:mx-0 bg-muted rounded-2xl overflow-hidden relative">
            <AppImage 
              src={room.imageUrl || undefined} 
              fallbackType="supplement"
              alt={room.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
            <h1
              className="text-2xl md:text-3xl font-serif mb-3 text-foreground leading-tight"
              dangerouslySetInnerHTML={{ __html: room.name }}
            />

            <div className="flex flex-col gap-2 mb-6 pb-6 border-b">
              <div className="flex items-end gap-3">
                <span className="text-2xl md:text-3xl font-semibold text-primary">{formatPrice(perNightPrice)}</span>
                <span className="text-sm text-muted-foreground mb-1">/ night</span>
              </div>
            </div>

            <div
              className="prose prose-sm md:prose-base prose-neutral max-w-none text-muted-foreground mb-8 [&_h2]:font-serif [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: room.description || "" }}
            />

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 text-base mb-6">
                  Book This Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Booking Information</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Number of Nights</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setNights((n) => Math.max(1, n - 1))}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-8 text-center font-medium">{nights}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setNights((n) => n + 1)}
                      >
                        <Plus size={16} />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-auto">
                        Total: {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={paymentMethod === "online" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("online")}
                      >
                        Pay Online
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === "counter" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("counter")}
                      >
                        Pay at Counter
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2 mt-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>

                  {paymentMethod === "counter" && (
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  )}

                  {paymentMethod === "online" && (
                    <>
                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="line1">Address Line 1</Label>
                        <Input id="line1" value={shippingAddress.line1} onChange={e => setShippingAddress(prev => ({ ...prev, line1: e.target.value }))} />
                      </div>
                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={shippingAddress.city} onChange={e => setShippingAddress(prev => ({ ...prev, city: e.target.value }))} />
                      </div>
                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="province">State</Label>
                        <Input id="province" required placeholder="e.g. Lagos, Ogun" value={shippingAddress.province} onChange={e => setShippingAddress(prev => ({ ...prev, province: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Postal/Zip Code</Label>
                          <Input id="postalCode" value={shippingAddress.postalCode} onChange={e => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country</Label>
                          <Input id="country" disabled value={shippingAddress.country} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={
                    createOrder.isPending ||
                    isPayAtCounterPending ||
                    !email ||
                    (paymentMethod === "online" && !shippingAddress.country)
                  }
                  className="w-full h-12"
                >
                  {createOrder.isPending || isPayAtCounterPending
                    ? "Processing..."
                    : paymentMethod === "online"
                      ? `Continue to Payment — ${formatPrice(totalPrice)}`
                      : `Confirm Booking (Pay at Counter) — ${formatPrice(totalPrice)}`}
                </Button>
              </DialogContent>
            </Dialog>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary shrink-0" />
                <span>Flexible scheduling</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary shrink-0" />
                <span>Private sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <span>Sanitized environment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
