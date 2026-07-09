import { Link } from "wouter";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutSuccess() {
  return (
    <div className="flex-1 flex items-center justify-center py-24 px-4 bg-muted/30">
      <Card className="w-full max-w-lg shadow-lg border-border">
        <CardContent className="p-10 text-center">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-green-100">
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-serif mb-4 text-foreground">Payment Successful</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Thank you for your order. We've sent a confirmation email with your receipt and order details.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full h-12 px-8">Go to Dashboard</Button>
            </Link>
            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-12 px-8 gap-2">
                <ShoppingBag size={18} /> Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
