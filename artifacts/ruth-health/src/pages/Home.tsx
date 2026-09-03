import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  GraduationCap,
  MessagesSquare,
  UserRound,
  X,
  BedDouble,
  Image as GalleryIcon,
  UtensilsCrossed,
  GlassWater,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const quickLinks = [
  { href: "/services", label: "Services", icon: Sparkles },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/testimonials", label: "Testimonials", icon: MessagesSquare },
  { href: "/login", label: "Member Login", icon: UserRound },
];

const trustMarkers = [
  {
    id: "curated-products",
    icon: HeartPulse,
    title: "Curated Products",
    description: "Rigorous selection of premium health and wellness supplements.",
  },
  {
    id: "member-pricing",
    icon: Sparkles,
    title: "Exclusive Member Pricing",
    description: "Members unlock significant savings and earn referral commissions.",
  },
  {
    id: "wellness-consultations",
    icon: ShieldCheck,
    title: "Wellness Consultations",
    description: "Private, dedicated time with wellness experts via Zoom.",
  },
];

// Rotating welcome backgrounds — a different one loads on every page visit.
const heroBackgrounds = [
  "/attached_assets/generated_images/106979063-1637620676414Master_Bed_2.webp",
  "/attached_assets/generated_images/106979065-1637620676414Breakfast_Table_1.webp",
  "/attached_assets/generated_images/106979066-1637620676414Kitchen_3.webp",
  "/attached_assets/generated_images/106979068-1637620676414Family_Room_1.webp",
  "/attached_assets/generated_images/106979069-1637620676414Guest_Bed_5.webp",
  "/attached_assets/generated_images/106979071-1637620676414Twilight_Aerial_1.webp",
  "/attached_assets/generated_images/106979072-1637620676414Terrace_View_1.webp",
  "/attached_assets/generated_images/106979073-1637621072294-Aerial_1.webp",
  "/attached_assets/generated_images/106979078-1637621796055-Twilight_1.webp",
  "/attached_assets/generated_images/106979081-1637621967928Twilight_3.webp",
  "/attached_assets/generated_images/106979088-1637623357214Patio_5.webp",
  "/attached_assets/generated_images/106979099-1637625605353Master_Bed_3.webp",
  "/attached_assets/generated_images/106979145-1637629270455Aerial_8.webp",
  "/attached_assets/generated_images/106979146-1637629270455Aerial_6.webp",
];

// Hotel quick-access menu. "Rooms & Suites" links to the real /rooms page.
// "Food & Drinks" opens a popup with Food / Drinks options. The remaining
// tiles don't have pages built yet, so they show a "Coming soon" toast on
// click instead of navigating.
const hotelQuickLinks: {
  label: string;
  icon: typeof BedDouble;
  href?: string;
  action?: "dialog";
}[] = [
  { label: "Rooms & Suites", icon: BedDouble, href: "/rooms" },
  { label: "Food & Drinks", icon: UtensilsCrossed, action: "dialog" },
  { label: "Amenities", icon: Sparkles },
  { label: "Gallery", icon: GalleryIcon },
];

// Bank of whole-word text entrance/exit effects for the two animated
// headline marks. Every ~5s (matching the animation duration) a new one
// is picked at random — never the same effect twice in a row, and not
// in any fixed sequence.
const TEXT_EFFECTS = [
  "clip-slide",
  "stagger-rise",
  "blur-focus",
  "weight-morph",
  "flip-3d",
  "glitch-split",
  "bounce-elastic",
  "spiral-wrap",
  "color-fill",
  "shuffle-overlap",
] as const;

function randomEffect(exclude?: string) {
  if (TEXT_EFFECTS.length <= 1) return TEXT_EFFECTS[0];
  let next = exclude;
  while (!next || next === exclude) {
    next = TEXT_EFFECTS[Math.floor(Math.random() * TEXT_EFFECTS.length)];
  }
  return next;
}

export default function Home() {
  const [openMarker, setOpenMarker] = useState<string | null>(null);
  const [bg] = useState(
    () => heroBackgrounds[Math.floor(Math.random() * heroBackgrounds.length)]
  );
  const [bgLoaded, setBgLoaded] = useState(false);
  const [foodDrinksOpen, setFoodDrinksOpen] = useState(false);
  const { toast } = useToast();

  // Each headline mark gets its own text effect, but they take turns
  // changing instead of both firing at once: Health Code Business
  // changes, then after a random 3–5s pause Benington Hotel changes,
  // then another random 3–5s pause, back to Health Code Business, etc.
  const [healthEffect, setHealthEffect] = useState(() => randomEffect());
  const [hotelEffect, setHotelEffect] = useState(() => randomEffect());

  useEffect(() => {
    let turn: "health" | "hotel" = "health";
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      // Random wait between 3 and 5 seconds — change these two numbers
      // (3000 / 5000, in milliseconds) to adjust the range.
      const delay = 3000 + Math.random() * (5000 - 3000);
      timeoutId = setTimeout(() => {
        if (turn === "health") {
          setHealthEffect((prev) => randomEffect(prev));
          turn = "hotel";
        } else {
          setHotelEffect((prev) => randomEffect(prev));
          turn = "health";
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Local styles: slow continuous zoom on the background, respects reduced-motion */}
      <style>{`
        @keyframes heroKenBurns {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.12) translate(-1.5%, -1.5%); }
        }
        .hero-kenburns {
          animation: heroKenBurns 24s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-kenburns { animation: none; }
        }

        /* Brand-name text effects: a bank of distinct animated styles.
           Only one style plays across all the letters at a time; a timer
           in the component swaps in a different, randomly-picked style
           every cycle (see TEXT_EFFECTS in the component below). */

        /* 1. Masked Clip-Path Slide-Up */
        @keyframes fxClipSlide {
          0%   { clip-path: inset(100% 0 0 0); opacity: 0; transform: translateY(14px); }
          16%  { clip-path: inset(0% 0 0 0); opacity: 1; transform: translateY(0); }
          78%  { clip-path: inset(0% 0 0 0); opacity: 1; transform: translateY(0); }
          90%  { clip-path: inset(0 0 100% 0); opacity: 0; transform: translateY(-14px); }
          100% { clip-path: inset(0 0 100% 0); opacity: 0; transform: translateY(-14px); }
        }
        /* 2. Staggered Character Rise */
        @keyframes fxStaggerRise {
          0%   { transform: translateY(34px); opacity: 0; }
          16%  { transform: translateY(0); opacity: 1; }
          78%  { transform: translateY(0); opacity: 1; }
          90%  { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        /* 3. Blur-to-Focus Fade */
        @keyframes fxBlurFocus {
          0%   { filter: blur(16px); opacity: 0; }
          16%  { filter: blur(0px); opacity: 1; }
          78%  { filter: blur(0px); opacity: 1; }
          90%  { filter: blur(12px); opacity: 0; }
          100% { filter: blur(12px); opacity: 0; }
        }
        /* 4. Variable Font Weight Morphing */
        @keyframes fxWeightMorph {
          0%   { font-weight: 300; opacity: 0; transform: scale(0.92); }
          16%  { font-weight: 700; opacity: 1; transform: scale(1); }
          50%  { font-weight: 400; }
          78%  { font-weight: 700; opacity: 1; }
          90%  { font-weight: 300; opacity: 0; transform: scale(0.92); }
          100% { font-weight: 300; opacity: 0; transform: scale(0.92); }
        }
        /* 5. 3D Axis Character Flip */
        @keyframes fxFlip3d {
          0%   { transform: perspective(400px) rotateY(-110deg); opacity: 0; }
          16%  { transform: perspective(400px) rotateY(0deg); opacity: 1; }
          78%  { transform: perspective(400px) rotateY(0deg); opacity: 1; }
          90%  { transform: perspective(400px) rotateY(90deg); opacity: 0; }
          100% { transform: perspective(400px) rotateY(90deg); opacity: 0; }
        }
        /* 6. Text Glitch Split */
        @keyframes fxGlitchSplit {
          0%   { opacity: 0; transform: translateX(0); text-shadow: 2px 0 #ff2ecf, -2px 0 #21e6ff; }
          8%   { opacity: 1; transform: translateX(-4px); }
          11%  { transform: translateX(3px); }
          14%  { transform: translateX(-1px); }
          16%  { transform: translateX(0); text-shadow: none; }
          78%  { opacity: 1; transform: translateX(0); text-shadow: none; }
          85%  { transform: translateX(3px); text-shadow: -2px 0 #ff2ecf, 2px 0 #21e6ff; }
          90%  { opacity: 0; transform: translateX(0); text-shadow: none; }
          100% { opacity: 0; }
        }
        /* 7. Elastic Bounce-In */
        @keyframes fxBounceElastic {
          0%   { transform: scale(0); opacity: 0; }
          12%  { transform: scale(1.45); opacity: 1; }
          20%  { transform: scale(0.85); }
          28%  { transform: scale(1.08); }
          36%  { transform: scale(1); }
          78%  { transform: scale(1); opacity: 1; }
          90%  { transform: scale(0.25); opacity: 0; }
          100% { transform: scale(0.25); opacity: 0; }
        }
        /* 8. Circular Spiral Wrap Reveal */
        @keyframes fxSpiralWrap {
          0%   { transform: rotate(220deg) scale(0); opacity: 0; }
          16%  { transform: rotate(0deg) scale(1); opacity: 1; }
          78%  { transform: rotate(0deg) scale(1); opacity: 1; }
          90%  { transform: rotate(-160deg) scale(0.2); opacity: 0; }
          100% { transform: rotate(-160deg) scale(0.2); opacity: 0; }
        }
        /* 9. Infilled Text Color Fill (sweeping gradient wipe) */
        @keyframes fxColorFill {
          0%   { background-position: 200% 50%; opacity: 0; }
          16%  { background-position: 0% 50%; opacity: 1; }
          78%  { background-position: 0% 50%; opacity: 1; }
          90%  { background-position: -120% 50%; opacity: 0; }
          100% { background-position: -120% 50%; opacity: 0; }
        }
        /* 10. Overlapping Character Shuffle */
        @keyframes fxShuffleOverlap {
          0%   { transform: translateX(var(--shuffle-x, 0)) rotate(var(--shuffle-r, 0deg)); opacity: 0; }
          16%  { transform: translateX(0) rotate(0deg); opacity: 1; }
          78%  { transform: translateX(0) rotate(0deg); opacity: 1; }
          90%  { transform: translateX(calc(var(--shuffle-x, 0) * -1)) rotate(calc(var(--shuffle-r, 0deg) * -1)); opacity: 0; }
          100% { transform: translateX(calc(var(--shuffle-x, 0) * -1)) rotate(calc(var(--shuffle-r, 0deg) * -1)); opacity: 0; }
        }

        .brand-letter {
          display: inline-block;
          background-size: 220% 100%;
          animation-duration: 5s;
          animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
          animation-iteration-count: infinite;
        }
        .fx-clip-slide     { animation-name: fxClipSlide; }
        .fx-stagger-rise   { animation-name: fxStaggerRise; }
        .fx-blur-focus     { animation-name: fxBlurFocus; }
        .fx-weight-morph   { animation-name: fxWeightMorph; }
        .fx-flip-3d        { animation-name: fxFlip3d; }
        .fx-glitch-split   { animation-name: fxGlitchSplit; }
        .fx-bounce-elastic { animation-name: fxBounceElastic; }
        .fx-spiral-wrap    { animation-name: fxSpiralWrap; }
        .fx-color-fill     { animation-name: fxColorFill; }
        .fx-shuffle-overlap{ animation-name: fxShuffleOverlap; }
        @media (prefers-reduced-motion: reduce) {
          .brand-letter { animation: none; opacity: 1; transform: none; filter: none; }
        }
      `}</style>

      {/* Two-column layout: Entrepreneur (left) / Hotel (right). Stacks on mobile. */}
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* ===================== LEFT COLUMN — THE ENTREPRENEUR ===================== */}
        <section className="relative overflow-hidden bg-stone-900 sm:min-h-[520px] md:min-h-[560px] flex items-center">
          {/* Background layer */}
          <div className="absolute inset-0">
            {/* Placeholder gradient shown until the photo finishes loading */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 transition-opacity duration-700 ${
                bgLoaded ? "opacity-0" : "opacity-100"
              }`}
            />
            <img
              src={bg}
              alt=""
              aria-hidden="true"
              onLoad={() => setBgLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                bgLoaded ? "opacity-100 hero-kenburns" : "opacity-0"
              }`}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/70" />
          </div>

          <div
            className={`container mx-auto px-4 relative z-10 pt-6 pb-6 sm:py-10 md:py-14 transition-all duration-700 ${
              bgLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {/* "Health Code Business" — the headline mark for this dashboard.
                Now sits in normal document flow, above "Lagos, Nigeria",
                so it can never overlap the content below it. */}
            <div
              className="flex flex-wrap items-center justify-center xl:justify-start gap-x-1.5 gap-y-1 mb-3 xl:mb-4"
              aria-label="Health Code Business"
            >
              {"Health Code Business".split("").map((char, i) =>
                char === " " ? (
                  <span key={i} className="inline-block w-2 md:w-2.5" />
                ) : (
                  <span
                    key={i}
                    className={`brand-letter fx-${healthEffect} font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]`}
                    style={{
                      animationDelay: `${-i * 0.08}s`,
                      "--shuffle-x": `${((i % 3) - 1) * 26}px`,
                      "--shuffle-r": `${((i % 3) - 1) * 12}deg`,
                    } as React.CSSProperties}
                  >
                    {char}
                  </span>
                )
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.55fr_1fr] gap-6 xl:gap-6 items-center">
              {/* Left: heading + copy + primary actions */}
              <div
                className={`text-center xl:text-left transition-all duration-700 delay-150 ${
                  bgLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 mb-2">
                  Lagos, Nigeria
                </p>
                <h1 className="text-2xl md:text-3xl xl:text-4xl font-serif text-white mb-2 leading-[1.08] tracking-tight">
                  Natural purity.<br/>
                  <span className="text-white/90 italic">Personalized care.</span>
                </h1>
                <p className="text-xs md:text-sm text-white/80 mb-3 max-w-md mx-auto xl:mx-0 leading-relaxed">
                  Exclusive pricing on organic wellness products, private consultations, and educational resources designed for your holistic well-being.
                </p>
                <div className="flex flex-row items-center justify-center xl:justify-start gap-2">
                  <Link href="/products" className="flex-[3] sm:flex-none inline-flex items-center justify-center h-9 px-5 rounded-md bg-white text-stone-900 text-xs md:text-sm font-medium hover:bg-white/90 transition-colors gap-2">
                    Shop Products <ArrowRight size={14} />
                  </Link>
                  <Link href="/book-a-call" className="flex-[2] sm:flex-none inline-flex items-center justify-center h-9 px-5 rounded-md border border-stone-300 bg-white text-stone-900 text-xs md:text-sm font-medium hover:bg-white/90 transition-colors">
                    Book Consultation
                  </Link>
                </div>
              </div>

              {/* Middle: click-to-reveal trust markers */}
              <div
                className={`relative z-30 flex flex-row xl:flex-col items-center xl:items-start justify-center gap-2 xl:gap-2.5 transition-all duration-700 delay-300 ${
                  bgLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {trustMarkers.map(({ id, icon: Icon, title, description }) => (
                  <div key={id} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMarker(openMarker === id ? null : id)}
                      aria-expanded={openMarker === id}
                      className="group flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md pl-2 pr-3 py-1.5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white group-hover:text-stone-900">
                        <Icon size={14} />
                      </span>
                      <span className="hidden sm:inline text-[11px] font-medium leading-tight text-white text-left">
                        {title}
                      </span>
                    </button>

                    {openMarker === id && (
                      <div className="absolute z-20 w-56 rounded-lg border border-border bg-popover p-3 shadow-xl top-full mt-2 left-1/2 -translate-x-1/2 xl:left-full xl:top-0 xl:mt-0 xl:ml-2 xl:translate-x-0">
                        <button
                          type="button"
                          onClick={() => setOpenMarker(null)}
                          aria-label="Close"
                          className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                        <h4 className="font-serif text-xs font-medium mb-1 pr-4 text-foreground">
                          {title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right: quick-access tile grid — 4 cols on phones, 3 once there's room */}
              <div
                className={`grid grid-cols-4 sm:grid-cols-3 gap-2 sm:gap-3 transition-all duration-700 delay-500 ${
                  bgLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {quickLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex flex-col items-center justify-center gap-1 h-[4.5rem] sm:h-24 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-sm px-1 text-center transition-all hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white group-hover:text-stone-900">
                      <Icon size={12} className="sm:hidden" />
                      <Icon size={15} className="hidden sm:block" />
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-medium leading-tight text-white">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================== RIGHT COLUMN — HOTEL DASHBOARD ===================== */}
        <section className="relative overflow-hidden bg-neutral-950 sm:min-h-[520px] md:min-h-[560px] flex items-center">
          {/* Background layer — same rotating photo as the left column */}
          <div className="absolute inset-0">
            {/* Placeholder gradient shown until the photo finishes loading */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 transition-opacity duration-700 ${
                bgLoaded ? "opacity-0" : "opacity-100"
              }`}
            />
            <img
              src={bg}
              alt=""
              aria-hidden="true"
              onLoad={() => setBgLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                bgLoaded ? "opacity-100 hero-kenburns" : "opacity-0"
              }`}
            />
            {/* Darker overlay — roughly double the dim of the left column, for a moodier hotel feel */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/90" />
          </div>

          <div className="container mx-auto px-4 relative z-10 py-6 sm:py-10 md:py-14">
            <div className="flex flex-col items-center text-center gap-4">
              <img
                src="/attached_assets/generated_images/RuthHotelLogo.png"
                alt="Benington Hotel & Suite"
                className="hidden sm:block sm:h-16 md:h-28 w-auto object-contain"
              />

              <div>
                <div
                  className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 mb-3"
                  aria-label="Benington Hotel & Suite"
                >
                  {"Benington Hotel".split("").map((char, i) =>
                    char === " " ? (
                      <span key={i} className="inline-block w-2 md:w-2.5" />
                    ) : (
                      <span
                        key={i}
                        className={`brand-letter fx-${hotelEffect} font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]`}
                        style={{
                          animationDelay: `${-i * 0.08}s`,
                          "--shuffle-x": `${((i % 3) - 1) * 26}px`,
                          "--shuffle-r": `${((i % 3) - 1) * 12}deg`,
                        } as React.CSSProperties}
                      >
                        {char}
                      </span>
                    )
                  )}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 mb-1">
                  Benin City, Edo State
                </p>
                <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
                  46, 1st Federal Road, Off Medical Store Road
                </p>
                <p className="text-xs text-white/60">Tel: 07075-787-516</p>
              </div>

              {/* Hotel quick-access tile grid — 4 cols on phones, 3 once there's room */}
              <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-sm mt-2">
                {hotelQuickLinks.map(({ label, icon: Icon, href, action }) => {
                  const tileClasses =
                    "flex flex-col items-center justify-center gap-1 h-[4.5rem] sm:h-24 rounded-xl border border-amber-400/20 bg-white/5 backdrop-blur-md shadow-sm px-1 text-center transition-all hover:-translate-y-0.5 hover:bg-white/10";

                  const tileContent = (
                    <>
                      <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
                        <Icon size={12} className="sm:hidden" />
                        <Icon size={15} className="hidden sm:block" />
                      </span>
                      <span className="text-[9px] sm:text-[11px] font-medium leading-tight text-white">
                        {label}
                      </span>
                    </>
                  );

                  if (href) {
                    return (
                      <Link key={label} href={href} className={tileClasses}>
                        {tileContent}
                      </Link>
                    );
                  }

                  if (action === "dialog") {
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFoodDrinksOpen(true)}
                        className={tileClasses}
                      >
                        {tileContent}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        toast({
                          title: "Coming soon",
                          description: `${label} isn't available yet — check back soon.`,
                        })
                      }
                      className={tileClasses}
                    >
                      {tileContent}
                    </button>
                  );
                })}
              </div>

              {/* Food & Drinks popup: choose Food or Drinks menu */}
              <Dialog open={foodDrinksOpen} onOpenChange={setFoodDrinksOpen}>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-center">
                      Food &amp; Drinks
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Link
                      href="/food"
                      onClick={() => setFoodDrinksOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-foreground transition-colors hover:bg-muted"
                    >
                      <UtensilsCrossed className="text-amber-500" size={22} />
                      <span className="text-sm font-medium">Food</span>
                    </Link>
                    <Link
                      href="/drinks"
                      onClick={() => setFoodDrinksOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-foreground transition-colors hover:bg-muted"
                    >
                      <GlassWater className="text-amber-500" size={22} />
                      <span className="text-sm font-medium">Drinks</span>
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
