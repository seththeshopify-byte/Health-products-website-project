import { useState } from "react";
import { useMenuCart } from "@/hooks/use-menu-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBasket, Minus, Plus, X } from "lucide-react";

type Step = "cart" | "fulfillment" | "delivery-details" | "dine-in-confirmed";

export function MenuCartDrawer() {
  const { lines, updateQuantity, removeItem, clear, count } = useMenuCart();
  const { isMember } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Nigeria",
  });
  const [dineInOrderId, setDineInOrderId] = useState<number | null>(null);

  const priceFor = (l: (typeof lines)[number]) => Number((isMember ? l.memberPrice ?? l.guestPrice : l.guestPrice) ?? 0);
  const total = lines.reduce((sum, l) => sum + priceFor(l) * l.quantity, 0);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const resetAndClose = () => {
    setStep("cart");
    setOpen(false);
  };

  const submitDelivery = async () => {
    if (!email || !isValidEmail(email)) {
      toast({ title: "Required", description: "A valid email is required to receive your payment confirmation", variant: "destructive" });
      return;
    }
    if (!shippingAddress.country) {
      toast({ title: "Required", description: "Country is required for delivery", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: lines.map((l) => ({ itemType: "menuItem", itemId: l.itemId, quantity: l.quantity })),
          shippingAddress,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to initiate checkout", variant: "destructive" });
        return;
      }
      clear();
      window.location.href = data.checkoutUrl;
    } catch {
      toast({ title: "Error", description: "Failed to initiate checkout", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitDineIn = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/cart/dine-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: lines.map((l) => ({ itemType: "menuItem", itemId: l.itemId, quantity: l.quantity })),
          email: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to place order", variant: "destructive" });
        return;
      }
      setDineInOrderId(data.orderId);
      clear();
      setStep("dine-in-confirmed");
    } catch {
      toast({ title: "Error", description: "Failed to place order", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setStep("cart");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed top-24 right-4 md:top-28 md:right-6 z-30 h-14 px-6 rounded-full shadow-lg gap-2.5 bg-background border-2 border-amber-500 hover:bg-amber-50"
        >
          <ShoppingBasket size={22} className="text-amber-700" />
          {count > 0 && (
            <span className="flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-amber-500 text-white text-xs font-bold px-1.5">
              {count}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        {step === "cart" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif italic">Your Order</DialogTitle>
            </DialogHeader>
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Your basket is empty.</p>
            ) : (
              <div className="py-2">
                {lines.map((l) => (
                  <div key={l.itemId} className="flex items-center gap-3 py-2.5 border-b border-dotted border-border">
                    <span className="flex-1 font-serif text-[15px]" dangerouslySetInnerHTML={{ __html: l.name }} />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(l.itemId, l.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm">{l.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(l.itemId, l.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-emerald-700 w-20 text-right whitespace-nowrap">
                      ₦{(priceFor(l) * l.quantity).toLocaleString()}
                    </span>
                    <button type="button" onClick={() => removeItem(l.itemId)} className="text-muted-foreground hover:text-destructive">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4">
                  <span className="uppercase tracking-[0.14em] text-[11px] text-muted-foreground">Total</span>
                  <span className="font-medium text-emerald-700">₦{total.toLocaleString()}</span>
                </div>
              </div>
            )}
            <Button className="w-full h-12 mt-4" disabled={lines.length === 0} onClick={() => setStep("fulfillment")}>
              Proceed to Checkout
            </Button>
          </>
        )}

        {step === "fulfillment" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif italic">How would you like this?</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <button
                type="button"
                onClick={submitDineIn}
                disabled={submitting}
                className="text-left border border-border rounded-lg p-4 hover:border-amber-500 transition-colors disabled:opacity-60"
              >
                <p className="font-serif text-foreground">Dining In</p>
                <p className="text-xs text-muted-foreground mt-1">No payment now — settle your bill with staff.</p>
              </button>
              <button
                type="button"
                onClick={() => setStep("delivery-details")}
                disabled={submitting}
                className="text-left border border-border rounded-lg p-4 hover:border-amber-500 transition-colors disabled:opacity-60"
              >
                <p className="font-serif text-foreground">Delivery / Takeaway</p>
                <p className="text-xs text-muted-foreground mt-1">Pay online now.</p>
              </button>
            </div>
          </>
        )}

        {step === "delivery-details" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif italic">Delivery Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="menu-email">Email</Label>
                <Input id="menu-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="menu-line1">Address Line 1</Label>
                <Input id="menu-line1" value={shippingAddress.line1} onChange={(e) => setShippingAddress((p) => ({ ...p, line1: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="menu-city">City</Label>
                <Input id="menu-city" value={shippingAddress.city} onChange={(e) => setShippingAddress((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="menu-province">State</Label>
                <Input
                  id="menu-province"
                  placeholder="e.g. Lagos, Ogun"
                  value={shippingAddress.province}
                  onChange={(e) => setShippingAddress((p) => ({ ...p, province: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="menu-postal">Postal/Zip Code</Label>
                  <Input id="menu-postal" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress((p) => ({ ...p, postalCode: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="menu-country">Country</Label>
                  <Input id="menu-country" disabled value={shippingAddress.country} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Free delivery within Lagos. A flat delivery fee applies outside Lagos.</p>
            </div>
            <Button onClick={submitDelivery} disabled={submitting || !shippingAddress.country || !email} className="w-full h-12">
              {submitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </>
        )}

        {step === "dine-in-confirmed" && (
          <div className="text-center py-8">
            <DialogHeader>
              <DialogTitle className="font-serif italic">Order Sent!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-3 mb-6">
              Your order{dineInOrderId ? ` #${dineInOrderId}` : ""} has been sent to our kitchen/bar — please settle your bill with staff when done.
            </p>
            <Button className="w-full h-12" onClick={resetAndClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
