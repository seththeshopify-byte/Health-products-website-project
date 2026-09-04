import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetMenuItem, getGetMenuItemQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MediaGallery } from "@/components/media-gallery";
import { ArrowLeft } from "lucide-react";
import { MenuItemOrderModal, type MenuOrderItem } from "@/components/menu-item-order-modal";

export default function DrinkDetail() {
  const [, params] = useRoute("/drinks/:id");
  const id = parseInt(params?.id || "0", 10);
  const { data: item, isLoading } = useGetMenuItem(id, {
    query: { enabled: !!id, queryKey: getGetMenuItemQueryKey(id) },
  });
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  if (!item) return <div className="min-h-[50vh] flex items-center justify-center">Item not found</div>;

  const orderItem: MenuOrderItem = {
    itemId: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    guestPrice: item.guestPrice,
    memberPrice: item.memberPrice,
    menuType: "drink",
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <Link href="/drinks" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Drinks Menu
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        <div className="space-y-6">
          <div className="max-w-[480px] mx-auto md:mx-0">
            <MediaGallery
              images={item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []}
              videos={item.videoUrls}
              alt={item.name}
              aspectClassName="aspect-square"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <h1
            className="text-2xl md:text-3xl font-serif mb-3 text-foreground leading-tight"
            dangerouslySetInnerHTML={{ __html: item.name }}
          />

          {item.guestPrice != null && (
            <div className="mb-6 pb-6 border-b">
              <span className="text-2xl md:text-3xl font-semibold text-primary">
                ₦{Number(item.guestPrice).toLocaleString()}
              </span>
            </div>
          )}

          {item.description && (
            <p className="text-muted-foreground mb-8 whitespace-pre-line leading-relaxed">
              {item.description}
            </p>
          )}

          <Button className="w-full h-12 text-base" onClick={() => setOrderModalOpen(true)}>
            Order Now
          </Button>
        </div>
      </div>

      <MenuItemOrderModal item={orderItem} open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </div>
  );
}
