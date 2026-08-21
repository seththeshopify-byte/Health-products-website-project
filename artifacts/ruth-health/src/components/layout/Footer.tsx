import { Link } from "wouter";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-4 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 lg:divide-x lg:divide-primary-foreground/20">

          {/* ===================== LEFT — WELLNESS / ENTREPRENEUR ===================== */}
          <div className="lg:pr-10">
            <h2 className="font-serif text-sm font-semibold mb-1">Ruth Health Products &amp; Services (Healthcode Company)</h2>
            <p className="text-primary-foreground/80 text-[11px] max-w-md">
              Premium organic wellness products, consultations, and educational resources — based in Lagos, Nigeria.
            </p>
            <div className="pt-2 mt-3 border-t border-primary-foreground/20 text-[9px] text-primary-foreground/60">
              <p>Individual results may vary.</p>
              <p className="mt-0.5">© {year} Ruth Health. Lagos, Nigeria.</p>
            </div>
          </div>

          {/* ===================== RIGHT — HOTEL ===================== */}
          <div className="lg:pl-10 pt-6 lg:pt-0 border-t lg:border-t-0 border-primary-foreground/20">
            <div className="flex items-center gap-2 mb-1">
              <img
                src="/attached_assets/generated_images/RuthHotelLogo.png"
                alt="Benington Hotel & Suite"
                className="h-7 w-auto"
              />
              <h2 className="font-serif text-sm font-semibold">Benington Hotel &amp; Suite</h2>
            </div>
            <p className="text-primary-foreground/80 text-[11px] max-w-md">
              46, 1st Federal Road, Off Medical Store Road, Benin City, Edo State
            </p>
            <p className="text-primary-foreground/80 text-[11px]">
              <a href="tel:07075787516" className="hover:text-white">Tel: 07075-787-516</a>
            </p>
            <div className="pt-2 mt-3 border-t border-primary-foreground/20 text-[9px] text-primary-foreground/60">
              <p>© {year} Benington Hotel &amp; Suite. Benin City, Nigeria.</p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
