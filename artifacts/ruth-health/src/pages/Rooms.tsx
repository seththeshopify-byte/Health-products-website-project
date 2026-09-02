import { useState } from "react";
import { Link } from "wouter";
import { X, Minus, Plus, ArrowLeft } from "lucide-react";
import { useListRooms, getListRoomsQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { REF_CODE_KEY } from "@/hooks/use-ref-code";
import { useToast } from "@/hooks/use-toast";

export default function Rooms() {
  const { data: rooms, isLoading } = useListRooms({ query: { queryKey: getListRoomsQueryKey() } });
  const [openRoomId, setOpenRoomId] = useState<number | null>(null);
  const openRoom = rooms?.find(r => r.id === openRoomId) || null;
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const [step, setStep] = useState<"details" | "form">("details");
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

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const resetBookingForm = () => {
    setStep("details");
    setEmail("");
    setPhone("");
    setNights(1);
    setPaymentMethod("online");
    setShippingAddress({ line1: "", city: "", province: "", postalCode: "", country: "Nigeria" });
  };

  const closeModal = () => {
    setOpenRoomId(null);
    resetBookingForm();
  };

  const handleCheckout = async () => {
    if (!openRoom) return;
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
          body: JSON.stringify({ roomId: openRoom.id, nights, email, phone: phone || undefined })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to submit booking");
        toast({ title: "Booking received", description: "We'll confirm your room and you'll pay at the counter on arrival." });
        closeModal();
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
        itemId: openRoom.id,
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

  const perNightPrice = openRoom?.guestPrice || 0;
  const totalPrice = perNightPrice * nights;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 relative">
      <Link
        href="/"
        aria-label="Close"
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={18} />
      </Link>
      <div className="mb-12">
        <h1 className="text-2xl md:text-3xl font-serif mb-2 text-foreground">Wellness Rooms</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Private wellness spaces designed for relaxation, therapy, and rejuvenation.
        </p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-4">
              <div className="bg-muted aspect-square rounded-xl" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {rooms?.map(room => (
            <button
              key={room.id}
              type="button"
              onClick={() => setOpenRoomId(room.id)}
              className="group block h-full text-left"
            >
              <Card className="h-full border-transparent shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-card border-border">
                <div className="aspect-square bg-muted w-full overflow-hidden relative">
                  <AppImage
                    src={room.imageUrl || undefined}
                    fallbackType="supplement"
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                </div>
                <CardContent className="p-6 flex flex-col justify-between h-[calc(100%-100%)]">
                  <div>
                    <h3
                      className="font-serif text-lg mb-2 group-hover:text-primary transition-colors"
                      dangerouslySetInnerHTML={{ __html: room.name }}
                    />
                    <div
                      className="text-sm text-muted-foreground line-clamp-2 mb-4 [&_*]:inline [&_*]:m-0 [&_*]:p-0"
                      dangerouslySetInnerHTML={{ __html: room.description }}
                    />
                  </div>
                  <div className="mt-auto">
                    <span className="text-xl font-medium text-foreground">{formatPrice(room.guestPrice)}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!openRoom} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto p-0"
        >
          {openRoom && (
            <div className="relative">
              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>

              {step === "details" && (
                <>
                  <div className="aspect-[16/9] w-full bg-muted overflow-hidden relative">
                    <AppImage
                      src={openRoom.imageUrl || undefined}
                      fallbackType="supplement"
                      alt={openRoom.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    <h2
                      className="text-2xl md:text-3xl font-serif mb-3 text-foreground"
                      dangerouslySetInnerHTML={{ __html: openRoom.name }}
                    />

                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-2xl font-semibold text-foreground">{formatPrice(openRoom.guestPrice)}</span>
                      <span className="text-sm text-muted-foreground mb-1">/ night</span>
                    </div>

                    <div
                      className="prose prose-sm md:prose-base prose-neutral max-w-none text-muted-foreground mb-8 [&_h2]:font-serif [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: openRoom.description || "" }}
                    />

                    <Button className="w-full h-12 text-base" onClick={() => setStep("form")}>
                      Book This Room
                    </Button>
                  </div>
                </>
              )}

              {step === "form" && (
                <div className="p-6 md:p-8">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>

                  <h2
                    className="text-xl md:text-2xl font-serif mb-6 text-foreground"
                    dangerouslySetInnerHTML={{ __html: openRoom.name }}
                  />

                  <div className="grid gap-4">
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

                    <Button
                      onClick={handleCheckout}
                      disabled={
                        createOrder.isPending ||
                        isPayAtCounterPending ||
                        !email ||
                        (paymentMethod === "online" && !shippingAddress.country)
                      }
                      className="w-full h-12 mt-4"
                    >
                      {createOrder.isPending || isPayAtCounterPending
                        ? "Processing..."
                        : paymentMethod === "online"
                          ? `Continue to Payment — ${formatPrice(totalPrice)}`
                          : `Confirm Booking (Pay at Counter) — ${formatPrice(totalPrice)}`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
