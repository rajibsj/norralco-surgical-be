import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchParams, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState<string>(searchParams.get('q') ?? '');
  const page = Number(searchParams.get('page') ?? '1');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params: Record<string, string> = {};
      if (search) params.q = search;
      if (page && page > 1) params.page = String(page);
      setSearchParams(params);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, page, setSearchParams]);

  const { data, error, isLoading } = useProducts({
    search: search,
    page,
    limit: 12,
  });

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-semibold">Products</h1>
          <div className="w-72">
            <Input
              aria-label="Search products"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </PageLayout.Header>

      <PageLayout.Content>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-40 w-full mb-2" />
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-5 w-1/2" />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border border-red-100 rounded">
            <strong className="text-red-700">Error</strong>
            <div className="text-sm mt-1">{error.message}</div>
          </div>
        )}

        {!isLoading && !error && data?.data && data.data.length === 0 && (
          <div className="p-6">
            <p>No products found.</p>
          </div>
        )}

        {!isLoading && !error && data?.data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map((p: any) => (
                <Card key={p.id} className="p-4">
                  <Link to={`/product/${p.slug}`} className="block">
                    {p.product_images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.product_images[0].url} alt={p.product_images[0].alt_text ?? p.name} className="h-40 w-full object-cover mb-2 rounded" />
                    ) : (
                      <div className="h-40 w-full bg-muted mb-2 rounded" />
                    )}
                    <h3 className="font-medium">{p.name}</h3>
                    <div className="text-sm text-muted-foreground">${Number(p.price).toFixed(2)}</div>
                  </Link>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <div />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchParams((prev) => {
                    const np = new URLSearchParams(prev);
                    const current = Number(np.get('page') ?? '1');
                    np.set('page', String(Math.max(1, current - 1)));
                    return np;
                  })}
                >
                  Prev
                </Button>
                <div>Page {page}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchParams((prev) => {
                    const np = new URLSearchParams(prev);
                    const current = Number(np.get('page') ?? '1');
                    np.set('page', String(current + 1));
                    return np;
                  })}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}
