import { useGetProduct, getGetProductQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import { formatPrice } from "@/lib/utils";
import { REF_CODE_KEY } from "@/hooks/use-ref-code";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: product, isLoading } = useGetProduct(id, { 
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } 
  });
  
  const { isMember } = useAuth();
  const createOrder = useCreateOrder();
  
  const [email, setEmail] = useState("");

  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Nigeria"
  });
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const price = isMember && product ? product.memberPrice : (product?.guestPrice || 0);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleCheckout = () => {
    if (!email || !isValidEmail(email)) {
      toast({ title: "Required", description: "A valid email is required to receive your payment confirmation", variant: "destructive" });
      return;
    }

    if (!shippingAddress.country) {
      toast({ title: "Required", description: "Country is required for shipping", variant: "destructive" });
      return;
    }

    createOrder.mutate({
      data: {
        itemType: "product",
        itemId: id,
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
  if (!product) return <div className="min-h-[50vh] flex items-center justify-center">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Apothecary
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        {/* Image Gallery */}
        <div className="space-y-6">
          <div className="aspect-square max-w-[480px] mx-auto md:mx-0 bg-muted rounded-2xl overflow-hidden relative">
            <AppImage 
              src={product.imageUrl || undefined} 
              fallbackType="supplement"
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-serif mb-3 text-foreground leading-tight">{product.name}</h1>
            
            <div className="flex flex-col gap-2 mb-6 pb-6 border-b">
              <div className="flex items-end gap-3">
                <span className="text-2xl md:text-3xl font-semibold text-primary">{formatPrice(price)}</span>
                {isMember && product.guestPrice !== price ? (
                  <span className="text-base text-muted-foreground line-through pb-0.5">{formatPrice(product.guestPrice)}</span>
                ) : null}
              </div>
              
              {isMember ? (
                <Badge variant="secondary" className="w-fit">Member Pricing Applied</Badge>
              ) : (
                <div className="text-sm bg-accent/50 text-accent-foreground px-4 py-3 rounded-md mt-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-secondary shrink-0" />
                  <span>Members pay {formatPrice(product.memberPrice)}. Contact an administrator to access member rates.</span>
                </div>
              )}
            </div>
            
            <div
              className="prose prose-sm md:prose-base prose-neutral max-w-none text-muted-foreground mb-8 [&_h2]:font-serif [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: product.description || "" }}
            />

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 text-base mb-6">
                  Proceed to Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Shipping Information</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="you@example.com"
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input 
                      id="line1" 
                      value={shippingAddress.line1} 
                      onChange={e => setShippingAddress(prev => ({ ...prev, line1: e.target.value }))} 
                    />
                  </div>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={shippingAddress.city} 
                      onChange={e => setShippingAddress(prev => ({ ...prev, city: e.target.value }))} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="province">State</Label>
                      <Input 
                        id="province" 
                        required
                        placeholder="e.g. Lagos, Ogun"
                        value={shippingAddress.province} 
                        onChange={e => setShippingAddress(prev => ({ ...prev, province: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={shippingAddress.city} 
                      onChange={e => setShippingAddress(prev => ({ ...prev, city: e.target.value }))} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Postal/Zip Code</Label>
                      <Input 
                        id="postalCode" 
                        value={shippingAddress.postalCode} 
                        onChange={e => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input 
                        id="country" 
                        disabled
                        value={shippingAddress.country} 
                        onChange={e => setShippingAddress(prev => ({ ...prev, country: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Free delivery within Lagos. A flat delivery fee applies outside Lagos.</p>
                </div>
                <Button 
                  onClick={handleCheckout} 
                  disabled={createOrder.isPending || !shippingAddress.country || !email}
                  className="w-full h-12"
                >
                  {createOrder.isPending ? "Processing..." : "Continue to Payment"}
                </Button>
              </DialogContent>
            </Dialog>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <span>Organic quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-primary shrink-0" />
                <span>Ships nationwide</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-primary shrink-0" />
                <span>30-day guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
