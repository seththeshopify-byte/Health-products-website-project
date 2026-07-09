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
  
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Nigeria"
  });
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const price = isMember && product ? product.memberPrice : (product?.guestPrice || 0);

  const handleCheckout = () => {
    if (!shippingAddress.country) {
      toast({ title: "Required", description: "Country is required for shipping", variant: "destructive" });
      return;
    }

    createOrder.mutate({
      data: {
        itemType: "product",
        itemId: id,
        promoCodeUsed: localStorage.getItem(REF_CODE_KEY) || undefined,
        shippingAddress
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
    <div className="container mx-auto px-4 py-12 md:py-24">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Apothecary
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        {/* Image Gallery */}
        <div className="space-y-6">
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
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
            <h1 className="text-3xl md:text-5xl font-serif mb-4 text-foreground">{product.name}</h1>
            
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-medium text-primary">{formatPrice(price)}</span>
                {isMember ? (
                  <span className="text-xl text-muted-foreground line-through pb-1">{formatPrice(product.guestPrice)}</span>
                ) : null}
              </div>
              
              {isMember ? (
                <Badge variant="secondary" className="w-fit">Member Pricing Applied</Badge>
              ) : (
                <div className="text-sm bg-accent/50 text-accent-foreground px-4 py-3 rounded-md mt-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-secondary" />
                  <span>Members pay {formatPrice(product.memberPrice)}. Contact an administrator to access member rates.</span>
                </div>
              )}
            </div>
            
            <div className="prose prose-sm md:prose-base prose-neutral max-w-none text-muted-foreground mb-8">
              <p>{product.description}</p>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-14 text-lg mb-8">
                  Proceed to Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Shipping Information</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
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
                  disabled={createOrder.isPending || !shippingAddress.country}
                  className="w-full h-12"
                >
                  {createOrder.isPending ? "Processing..." : "Continue to Payment"}
                </Button>
              </DialogContent>
            </Dialog>

            <div className="space-y-4 border-t pt-8">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <ShieldCheck size={20} className="text-primary" />
              <span>Premium organic quality ingredients</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Truck size={20} className="text-primary" />
              <span>Ships across Nigeria</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <RotateCcw size={20} className="text-primary" />
              <span>30-day quality guarantee</span>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
