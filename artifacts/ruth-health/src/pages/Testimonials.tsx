import { useListTestimonials, getListTestimonialsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Testimonials() {
  const { data: testimonials, isLoading } = useListTestimonials({ query: { queryKey: getListTestimonialsQueryKey() } });

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif mb-6">Patient Stories</h1>
        <p className="text-xl text-muted-foreground">
          Real experiences from individuals who have partnered with Ruth Health to improve their well-being and vitality.
        </p>
      </div>

      {isLoading ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-muted rounded-2xl h-[250px] w-full" />
          ))}
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 pb-12">
          {testimonials?.map(testimonial => (
            <div key={testimonial.id} className="break-inside-avoid">
              <Card className="border-border/50 bg-card/50 hover:bg-card transition-colors shadow-sm">
                <CardContent className="p-8">
                  <div className="flex text-amber-400 mb-6">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <p className="text-foreground italic mb-8 leading-relaxed text-lg">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-border">
                      {testimonial.photoUrl ? (
                        <img src={testimonial.photoUrl} alt={testimonial.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif text-lg text-muted-foreground">{testimonial.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-base">{testimonial.name}</div>
                      <div className="text-sm font-medium text-secondary">Verified Member</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
