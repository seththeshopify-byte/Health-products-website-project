import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";
import { useListProducts, useListServices, useListTestimonials, getListProductsQueryKey, getListServicesQueryKey, getListTestimonialsQueryKey } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";

export default function Home() {
  const { data: products } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const { data: services } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const { data: testimonials } = useListTestimonials({ query: { queryKey: getListTestimonialsQueryKey() } });

  const featuredProducts = products?.slice(0, 3) || [];
  const featuredServices = services?.slice(0, 2) || [];
  const featuredTestimonials = testimonials?.slice(0, 3) || [];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <ShieldCheck size={16} />
              Premium Organic Wellness from Lagos
            </span>
            <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-8 leading-[1.1] tracking-tight">
              Natural purity.<br/>
              <span className="text-primary italic">Personalized care.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Exclusive pricing on organic wellness products, private consultations, and educational resources designed for your holistic well-being.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/products" className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors gap-2">
                Shop Products <ArrowRight size={18} />
              </Link>
              <Link href="/book-a-call" className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 rounded-md border border-input bg-background font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                Book Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Markers */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x border-border">
            <div className="flex flex-col items-center justify-center p-4">
              <HeartPulse className="text-secondary mb-3" size={32} />
              <h3 className="font-serif text-xl font-medium mb-2">Curated Products</h3>
              <p className="text-sm text-muted-foreground">Rigorous selection of premium health and wellness supplements.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <Sparkles className="text-secondary mb-3" size={32} />
              <h3 className="font-serif text-xl font-medium mb-2">Exclusive Member Pricing</h3>
              <p className="text-sm text-muted-foreground">Members unlock significant savings and earn referral commissions.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <ShieldCheck className="text-secondary mb-3" size={32} />
              <h3 className="font-serif text-xl font-medium mb-2">Wellness Consultations</h3>
              <p className="text-sm text-muted-foreground">Private, dedicated time with wellness experts via Zoom.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif mb-4">Wellness Apothecary</h2>
              <p className="text-muted-foreground max-w-xl">Curated supplements and devices to support your daily health regimen.</p>
            </div>
            <Link href="/products" className="hidden md:inline-flex items-center font-medium text-primary hover:underline gap-1">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <Link key={product.id} href={`/products/${product.id}`} className="group group-hover:no-underline">
                <Card className="h-full border-transparent shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-muted/20">
                  <div className="aspect-[4/3] bg-muted w-full overflow-hidden">
                    <img 
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1615486171448-4fd13e8e20f1?q=80&w=800&auto=format&fit=crop'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground line-through mr-2">{formatPrice(product.guestPrice)}</span>
                        <span className="font-medium text-lg text-primary">{formatPrice(product.memberPrice)}</span>
                      </div>
                      <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded">Member Price</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/products" className="inline-flex items-center font-medium text-primary hover:underline gap-1">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif mb-6">Private Consultations</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-md">
                Get dedicated, one-on-one time with our wellness experts. Discuss your specific health goals in a private, secure Zoom environment.
              </p>
              <div className="space-y-4 mb-8">
                {featuredServices.map(service => (
                  <Link key={service.id} href={`/services/${service.id}`} className="block group">
                    <div className="bg-primary-foreground/5 hover:bg-primary-foreground/10 border border-primary-foreground/10 rounded-lg p-6 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-serif text-xl font-medium">{service.name}</h3>
                        <ArrowRight className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" size={20} />
                      </div>
                      <div className="text-primary-foreground/70 text-sm">
                        <span className="font-medium text-primary-foreground">{formatPrice(service.memberPrice)}</span> Member / {formatPrice(service.guestPrice)} Guest
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/services" className="inline-flex items-center font-medium text-primary-foreground hover:text-white transition-colors gap-2">
                Explore all services <ArrowRight size={18} />
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-primary-foreground/10">
                <img 
                  src="attached_assets/generated_images/consultation.jpg" 
                  alt="Consultation Room" 
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Patient Experiences</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-12">Hear from our community members about their journey with Ruth Health.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredTestimonials.map(testimonial => (
              <Card key={testimonial.id} className="text-left border-border/50 bg-card">
                <CardContent className="p-8">
                  <div className="flex text-amber-400 mb-4">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <p className="text-foreground italic mb-6">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                      {testimonial.photoUrl ? (
                        <img src={testimonial.photoUrl} alt={testimonial.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-medium text-sm text-muted-foreground">{testimonial.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground text-secondary">Verified Member</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12">
            <Link href="/testimonials" className="inline-flex items-center justify-center h-12 px-8 rounded-md border border-input bg-background font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              Read More Stories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
