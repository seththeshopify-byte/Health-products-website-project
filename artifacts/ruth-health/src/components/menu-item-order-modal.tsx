import { useState } from "react";
import { useMenuCart } from "@/hooks/use-menu-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus } from "lucide-react";

export interface MenuOrderItem {
  itemId: number;
  name: string;
  guestPrice: number | null;
  memberPrice: number | null;
  menuType: "food" | "drink";
}

export function MenuItemOrderModal({
  item,
  open,
  onOpenChange,
}: {
  item: MenuOrderItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem } = useMenuCart();
  const { isMember } = useAuth();
  const [quantity, setQuantity] = useState(1);

  // Reset quantity each time a new item is opened.
  const handleOpenChange = (next: boolean) => {
    if (next) setQuantity(1);
    onOpenChange(next);
  };

  if (!item) return null;

  const unitPrice = Number((isMember ? item.memberPrice ?? item.guestPrice : item.guestPrice) ?? 0);
  const total = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(
      { itemId: item.itemId, name: item.name, guestPrice: item.guestPrice, memberPrice: item.memberPrice },
      quantity
    );
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-amber-600 mb-1">
            {item.menuType === "drink" ? "Bar" : "Kitchen"}
          </p>
          <DialogTitle className="font-serif italic text-2xl" dangerouslySetInnerHTML={{ __html: item.name }} />
        </DialogHeader>

        <div className="py-2">
          <p className="text-2xl font-medium text-emerald-700 mb-6">₦{unitPrice.toLocaleString()}</p>

          <div className="flex items-center justify-between border-y border-dotted border-border py-4 mb-6">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-base font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</span>
            <span className="text-xl font-semibold text-emerald-700">₦{total.toLocaleString()}</span>
          </div>

          <Button onClick={handleAddToCart} className="w-full h-12 text-base">
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
