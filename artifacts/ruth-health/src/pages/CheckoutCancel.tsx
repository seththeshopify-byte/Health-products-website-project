import { Link } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutCancel() {
  return (
    <div className="flex-1 flex items-center justify-center py-24 px-4 bg-muted/30">
      <Card className="w-full max-w-lg shadow-lg border-border">
        <CardContent className="p-10 text-center">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-red-100">
            <XCircle size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-serif mb-4 text-foreground">Payment Cancelled</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Your payment was not completed and you haven't been charged. You can try again whenever you're ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products" className="w-full sm:w-auto">
              <Button className="w-full h-12 px-8 gap-2">
                <ArrowLeft size={18} /> Back to Products
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
