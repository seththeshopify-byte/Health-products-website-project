import { useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { useListRooms, getListRoomsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

export default function Rooms() {
  const { data: rooms, isLoading } = useListRooms({ query: { queryKey: getListRoomsQueryKey() } });
  const [openRoomId, setOpenRoomId] = useState<number | null>(null);
  const openRoom = rooms?.find(r => r.id === openRoomId) || null;

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

      <Dialog open={!!openRoom} onOpenChange={(open) => !open && setOpenRoomId(null)}>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto p-0"
        >
          {openRoom && (
            <div className="relative">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpenRoomId(null)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>

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
                </div>

                <div
                  className="prose prose-sm md:prose-base prose-neutral max-w-none text-muted-foreground mb-8 [&_h2]:font-serif [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: openRoom.description || "" }}
                />

                <Link href={`/rooms/${openRoom.id}`}>
                  <Button className="w-full h-12 text-base">Book This Room</Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
