import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useProduct } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

export default function ProductPage() {
  const { slug } = useParams();
  const { data, error, isLoading } = useProduct(slug);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const cart = useCart();

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <div>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </div>
          </div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <div className="p-6 bg-red-50 border border-red-100 rounded">
            <strong className="text-red-700">Failed to load product</strong>
            <div className="text-sm mt-1">{error.message}</div>
          </div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <div>Product not found.</div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const product = data as any;
  const images = product.product_images ?? [];

  const addToCart = () => {
    cart.addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      sku: product.sku,
      image: images[0]?.url ?? null,
      variant: null,
      quantity: 1,
    });
  };

  return (
    <PageLayout>
      <PageLayout.Header>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
      </PageLayout.Header>

      <PageLayout.Content>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card className="p-4">
              {selectedImage || images[0]?.url ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={selectedImage ?? images[0]?.url} alt={product.name} className="w-full h-96 object-contain mb-4" />
              ) : (
                <div className="h-96 bg-muted rounded mb-4" />
              )}

              <div className="flex gap-2">
                {images.map((img: any) => (
                  <button key={img.id} onClick={() => setSelectedImage(img.url)} className="w-20 h-20 border rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt_text ?? product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-4 space-y-4">
              <div className="text-xl font-medium">${Number(product.price).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">{product.description}</div>

              <div>
                <h4 className="font-medium">Attributes</h4>
                <ul className="list-disc list-inside">
                  {(product.product_attributes ?? []).map((a: any) => (
                    <li key={a.id}>
                      <strong>{a.attribute_name}:</strong> {a.attribute_value}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={addToCart}>Add to cart</Button>
                <Button variant="outline">Wishlist</Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Card className="p-4">
            <h3 className="font-medium">Reviews</h3>
            {(product.reviews ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No reviews yet.</div>
            ) : (
              <ul className="space-y-3">
                {(product.reviews ?? []).map((r: any) => (
                  <li key={r.id} className="border-b pb-2">
                    <div className="text-sm font-medium">Rating: {r.rating}/5</div>
                    <div className="text-sm text-muted-foreground">{r.comment}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
