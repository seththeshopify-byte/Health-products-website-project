import { Link } from "wouter";
export function Footer() {
  return (
    <footer className="bg-primary/70 backdrop-blur-sm text-primary-foreground py-6 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="col-span-1 md:col-span-2">
            <h2 className="font-serif text-lg font-semibold mb-1.5">Ruth Health Products &amp; Services (Healthcode Company)</h2>
            <p className="text-primary-foreground/80 text-xs max-w-md">
              A premium organic wellness platform based in Lagos, providing exclusive access to curated natural products, professional consultations, and educational resources across Nigeria.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1.5">Quick Links</h3>
            <ul className="space-y-1 text-xs text-primary-foreground/80">
              <li><Link href="/products" className="hover:text-white">Shop Products</Link></li>
              <li><Link href="/services" className="hover:text-white">Our Services</Link></li>
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
        <div className="pt-3 border-t border-primary-foreground/20 text-[10px] text-primary-foreground/60 text-center">
          <p>Individual results may vary.</p>
          <p className="mt-0.5">© {new Date().getFullYear()} Ruth Health. Lagos, Nigeria.</p>
        </div>
      </div>
    </footer>
  );
}
