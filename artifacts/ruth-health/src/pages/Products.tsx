import { Link } from "wouter";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { formatPrice } from "@/lib/utils";

export default function Products() {
  const { data: products, isLoading } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const { isMember } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Wellness Apothecary</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Curated supplements and wellness devices selected for their efficacy and quality.
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
          {products?.map(product => (
            <Link key={product.id} href={`/products/${product.id}`} className="group block h-full">
              <Card className="h-full border-transparent shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-card border-border">
                <div className="aspect-square bg-muted w-full overflow-hidden relative">
                  <AppImage 
                    src={product.imageUrl || undefined} 
                    fallbackType="supplement"
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {isMember && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="shadow-sm">Member Pricing</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 flex flex-col justify-between h-[calc(100%-100%)]">
                  <div>
                    <h3 className="font-serif text-lg mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                  </div>
                  <div className="mt-auto">
                    {isMember ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-medium text-primary">{formatPrice(product.memberPrice)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(product.guestPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-medium text-foreground">{formatPrice(product.guestPrice)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
