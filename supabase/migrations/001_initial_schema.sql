-- 001_initial_schema.sql
-- Initial schema for Norralco E-commerce platform
-- One migration per schema change as required.

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- profiles table (linked to auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text UNIQUE,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false
);

-- categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- product_attributes table
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name text NOT NULL,
  attribute_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  is_thumbnail boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- product_stock table
CREATE TABLE IF NOT EXISTS public.product_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_attributes_json jsonb DEFAULT '{}'::jsonb,
  quantity int DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending',
  shipping_address_json jsonb,
  billing_address_json jsonb,
  stripe_payment_intent_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  sku text,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  variant_attributes_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- static_content table
CREATE TABLE IF NOT EXISTS public.static_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- media_library table
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf','video','image')),
  url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz DEFAULT now()
);

-- Indexes for search
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);

-- RLS: enable on relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin check
-- We'll use an EXISTS pattern in policies:
-- exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)

-- profiles policies
CREATE POLICY "profiles_owner_or_admin_read" ON public.profiles
  FOR SELECT USING (
    auth.role() = 'anon' OR
    auth.role() = 'authenticated' AND (
      (id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
    )
  );

CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- categories: public read, admins manage
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admins_write" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- products: public read, admins manage
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admins_write" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- product_attributes/images/stock: public read, admins write
CREATE POLICY "attrs_public_read" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "attrs_admins_write" ON public.product_attributes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE POLICY "images_public_read" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "images_admins_write" ON public.product_images FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE POLICY "stock_public_read_quantity" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "stock_admins_write" ON public.product_stock FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- orders: users can create their own orders; users can read their own orders; admins can read/update all
CREATE POLICY "orders_authenticated_insert" ON public.orders FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "orders_owner_read" ON public.orders FOR SELECT USING (
  auth.role() = 'authenticated' AND (user_id = auth.uid())
);

CREATE POLICY "orders_admin_read_update" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
);

-- order_items: accessible by owner/admin via join with orders
CREATE POLICY "order_items_owner_or_admin" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (
      o.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
    )
  )
);

CREATE POLICY "order_items_admin_write" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
);

-- reviews: public read; authenticated users can insert for themselves; admin can delete
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert_authenticated" ON public.reviews FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);

CREATE POLICY "reviews_user_update" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- static_content/blog/media: public read; admins manage
CREATE POLICY "static_public_read" ON public.static_content FOR SELECT USING (true);
CREATE POLICY "static_admins_write" ON public.static_content FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "blog_admins_write" ON public.blog_posts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE POLICY "media_public_read" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "media_admins_write" ON public.media_library FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- contact_submissions: anyone can insert (guests), admins can read
CREATE POLICY "contact_insert_public" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_admin_read" ON public.contact_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- newsletter: anyone can insert (subscribe), admins can read
CREATE POLICY "newsletter_insert_public" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "newsletter_admin_read" ON public.newsletter_subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- Add trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('pg_stat_statements') LOOP
    EXECUTE format('
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = %L
        ) THEN
          CREATE TRIGGER %I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
        END IF;
      END $$;
    ', 'set_updated_at_trigger_' || tbl, 'set_updated_at_trigger_' || tbl, tbl);
  END LOOP;
END;
$$;

-- End of migration 001
