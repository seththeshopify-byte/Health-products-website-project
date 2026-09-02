import { useRef, useState, useEffect } from "react";
import { Expand, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaGalleryProps {
  images: string[];
  videos?: string[] | null;
  alt: string;
  aspectClassName?: string;
  className?: string;
}

type Slide = { type: "image" | "video"; src: string };

export function MediaGallery({ images, videos, alt, aspectClassName = "aspect-square", className = "" }: MediaGalleryProps) {
  const slides: Slide[] = [
    ...images.filter(Boolean).map((src) => ({ type: "image" as const, src })),
    ...(videos || []).filter(Boolean).map((src) => ({ type: "video" as const, src })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lightboxScrollRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (ref: React.RefObject<HTMLDivElement>, index: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (lightboxOpen) {
      requestAnimationFrame(() => scrollToIndex(lightboxScrollRef, lightboxIndex));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const handleLightboxScroll = () => {
    const el = lightboxScrollRef.current;
    if (!el) return;
    setLightboxIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (slides.length === 0) {
    return <div className={`w-full ${aspectClassName} bg-muted rounded-2xl overflow-hidden relative ${className}`} />;
  }

  return (
    <>
      <div className={`relative w-full ${aspectClassName} rounded-2xl overflow-hidden bg-muted ${className}`}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 snap-center relative">
              {slide.type === "image" ? (
                <button type="button" onClick={() => openLightbox(i)} className="w-full h-full block" aria-label="Zoom image">
                  <img src={slide.src} alt={alt} className="w-full h-full object-cover" />
                </button>
              ) : (
                <video src={slide.src} controls className="w-full h-full object-cover" />
              )}
              {slide.type === "image" && (
                <div className="absolute bottom-3 right-3 flex items-center justify-center h-8 w-8 rounded-full bg-black/50 text-white pointer-events-none">
                  <Expand size={14} />
                </div>
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {slides.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollToIndex(scrollRef, Math.max(0, activeIndex - 1))}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(scrollRef, Math.min(slides.length - 1, activeIndex + 1))}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>

          <div
            ref={lightboxScrollRef}
            onScroll={handleLightboxScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {slides.map((slide, i) => (
              <div key={i} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-4">
                {slide.type === "image" ? (
                  <img src={slide.src} alt={alt} className="max-w-full max-h-full object-contain" />
                ) : (
                  <video src={slide.src} controls autoPlay className="max-w-full max-h-full object-contain" />
                )}
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {slides.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === lightboxIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
