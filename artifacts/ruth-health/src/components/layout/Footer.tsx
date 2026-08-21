import { Link } from "wouter";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-6 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 lg:divide-x lg:divide-primary-foreground/20">

          {/* ===================== LEFT — WELLNESS / ENTREPRENEUR ===================== */}
          <div className="lg:pr-10">
            <h2 className="font-serif text-lg font-semibold mb-1.5">Ruth Health Products &amp; Services (Healthcode Company)</h2>
            <p className="text-primary-foreground/80 text-xs max-w-md mb-4">
              Premium organic wellness products, consultations, and educational resources — based in Lagos, Nigeria.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1.5">Quick Links</h3>
                <ul className="space-y-1 text-xs text-primary-foreground/80">
                  <li><Link href="/products" className="hover:text-white">Shop Products</Link></li>
                  <li><Link href="/courses" className="hover:text-white">Wellness Courses</Link></li>
                  <li><Link href="/book-a-call" className="hover:text-white">Book Consultation</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1.5">Support</h3>
                <ul className="space-y-1 text-xs text-primary-foreground/80">
                  <li><Link href="/login" className="hover:text-white">Member Login</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/testimonials" className="hover:text-white">Testimonials</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-3 mt-4 border-t border-primary-foreground/20 text-[10px] text-primary-foreground/60">
              <p>Individual results may vary.</p>
              <p className="mt-0.5">© {year} Ruth Health. Lagos, Nigeria.</p>
            </div>
          </div>

          {/* ===================== RIGHT — HOTEL ===================== */}
          <div className="lg:pl-10 pt-8 lg:pt-0 border-t lg:border-t-0 border-primary-foreground/20">
            <div className="flex items-center gap-2 mb-1.5">
              <img
                src="/attached_assets/generated_images/RuthHotelLogo.png"
                alt="Benington Hotel & Suite"
                className="h-9 w-auto"
              />
              <h2 className="font-serif text-lg font-semibold">Benington Hotel &amp; Suite</h2>
            </div>
            <p className="text-primary-foreground/80 text-xs max-w-md mb-4">
              46, 1st Federal Road, Off Medical Store Road, Benin City, Edo State
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1.5">Hotel</h3>
                <ul className="space-y-1 text-xs text-primary-foreground/80">
                  <li className="opacity-60" title="Coming soon">Rooms &amp; Suites</li>
                  <li className="opacity-60" title="Coming soon">Book a Stay</li>
                  <li className="opacity-60" title="Coming soon">Amenities</li>
                  <li className="opacity-60" title="Coming soon">Gallery</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1.5">Contact</h3>
                <ul className="space-y-1 text-xs text-primary-foreground/80">
                  <li><a href="tel:07075787516" className="hover:text-white">07075-787-516</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-3 mt-4 border-t border-primary-foreground/20 text-[10px] text-primary-foreground/60">
              <p>© {year} Benington Hotel &amp; Suite. Benin City, Nigeria.</p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
