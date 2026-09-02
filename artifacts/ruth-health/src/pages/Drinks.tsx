import { useEffect, useState } from "react";
import { useListMenuItems, getListMenuItemsQueryKey } from "@workspace/api-client-react";
import { MenuCartDrawer } from "@/components/menu-cart-drawer";
import { MenuItemOrderModal, type MenuOrderItem } from "@/components/menu-item-order-modal";

export default function Drinks() {
  const { data: items, isLoading } = useListMenuItems(
    { type: "drink" },
    { query: { queryKey: getListMenuItemsQueryKey({ type: "drink" }) } }
  );

  const categories = Array.from(new Set((items ?? []).map((i) => i.category)));
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuOrderItem | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [bgColors, setBgColors] = useState<Record<string, string>>({});

  const extractEdgeColor = (
    e: React.SyntheticEvent<HTMLImageElement>,
    itemId: string
  ) => {
    try {
      const img = e.currentTarget;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Sample from the top-left corner pixel of the source image, scaled to 1x1
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setBgColors((prev) => ({ ...prev, [itemId]: `rgb(${r}, ${g}, ${b})` }));
    } catch {
      // Canvas may be tainted by cross-origin images without CORS headers; fall back silently.
    }
  };

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const visibleItems = (items ?? []).filter((i) => i.category === activeCategory);

  const openItem = (item: (typeof visibleItems)[number]) => {
    setSelectedItem({
      itemId: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      guestPrice: item.guestPrice != null ? Number(item.guestPrice) : null,
      memberPrice: item.memberPrice != null ? Number(item.memberPrice) : null,
      menuType: "drink",
    });
    setOrderModalOpen(true);
  };

  return (
    <div className="relative">
      <style>{`
        .menu-texture {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 37px,
            hsl(var(--border)) 37px,
            hsl(var(--border)) 38px
          );
        }
      `}</style>

      <div className="menu-texture">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-amber-600 mb-3">
              Bar
            </p>
            <h1 className="text-3xl md:text-4xl font-serif italic text-foreground mb-2">
              Drinks Menu
            </h1>
            <p className="text-sm text-muted-foreground">
              Benington Hotel &amp; Suite
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Menu items coming soon.
            </p>
          ) : (
            <>
              <nav className="sticky top-0 z-10 -mx-4 px-4 py-3 mb-8 bg-background/90 backdrop-blur-sm border-b border-border flex flex-wrap justify-center gap-x-6 gap-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-xs font-medium uppercase tracking-[0.14em] pb-1.5 border-b-2 transition-colors ${
                      activeCategory === cat
                        ? "border-amber-500 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </nav>

              <div
                key={activeCategory}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <ul className="space-y-0">
                  {visibleItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 py-4 border-b border-dotted border-border"
                    >
                      {item.imageUrl && (
                        <button
                          type="button"
                          onClick={() => openItem(item)}
                          style={{ backgroundColor: bgColors[item.id] ?? undefined }}
                          className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            crossOrigin="anonymous"
                            onLoad={(e) => extractEdgeColor(e, item.id)}
                            className="relative w-full h-full object-contain"
                          />
                        </button>
                      )}

                      <div className="flex items-baseline gap-3">
                        <span
                          className="font-serif text-[16.5px] text-foreground"
                          dangerouslySetInnerHTML={{ __html: item.name }}
                        />
                        <span className="flex-1 border-b border-dotted border-border/70 translate-y-[-4px]" />
                        {item.guestPrice != null ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm font-medium text-emerald-700">
                              ₦{Number(item.guestPrice).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => openItem(item)}
                              className="text-[10px] uppercase tracking-wide font-medium text-amber-700 border border-amber-500/50 rounded-full px-2.5 py-1 hover:bg-amber-50 transition-colors"
                            >
                              Order Now
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground whitespace-nowrap">
                            Ask our staff
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <button
                          type="button"
                          onClick={() => openItem(item)}
                          className="self-start text-[11px] text-muted-foreground/70 underline underline-offset-2 hover:text-muted-foreground transition-colors"
                        >
                          More
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <p className="text-center text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-14">
            Prices in Nigerian Naira (₦) · Subject to change without notice
          </p>
        </div>
      </div>

      <MenuItemOrderModal item={selectedItem} open={orderModalOpen} onOpenChange={setOrderModalOpen} />
      <MenuCartDrawer />
    </div>
  );
}
