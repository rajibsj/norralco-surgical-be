import { supabase } from '@/integrations/supabase/client';

export type ProductFilter = {
  category_id?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getProducts(params: ProductFilter = {}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit || 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      sku,
      description,
      price,
      category_id,
      created_at,
      product_images (
        id,
        url,
        alt_text,
        is_thumbnail,
        sort_order
      )
    `
    )
    .order('created_at', { ascending: false });

  if (params.category_id) {
    query = query.eq('category_id', params.category_id);
  }

  if (params.search && params.search.length > 0) {
    // simple ilike search on name and sku
    query = query.ilike('name', `%${params.search}%`);
    // To also search sku or description, a more complex OR is needed; keep minimal for now
  }

  const { data, error } = await query.range(from, to);

  if (error) {
    throw error;
  }

  // total count
  const { count, error: countErr } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  if (countErr) {
    // Not fatal for UI; continue
    return { data, total: null };
  }

  return { data, total: count ?? null };
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      sku,
      description,
      price,
      category_id,
      created_at,
      product_images (
        id,
        url,
        alt_text,
        is_thumbnail,
        sort_order
      ),
      product_attributes (
        id,
        attribute_name,
        attribute_value
      ),
      reviews (
        id,
        user_id,
        rating,
        comment,
        created_at
      )
    `
    )
    .eq('slug', slug)
    .limit(1)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
