import { useQuery } from '@tanstack/react-query';
import { getProducts, ProductFilter, getProductBySlug } from '@/lib/api/productsService';

export function useProducts(params: ProductFilter) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    keepPreviousData: true,
  });
}

export function useProduct(slug: string | undefined | null) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Missing product slug');
      return getProductBySlug(slug);
    },
    enabled: !!slug,
  });
}
