export const SUPABASE_SETUP_SQL = `-- ========================================================
-- LAMIVILLE E-COMMERCE SUPABASE SETUP SCRIPT
-- Paste this entire script into the Supabase SQL Editor and click RUN
-- ========================================================

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL CHECK (category IN ('scarves', 'veils', 'accessories', 'others')),
  image_url TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 10 CHECK (stock_quantity >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create indexes for high-speed browsing and filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products (is_available);

-- 3. Trigger to auto-update 'updated_at' on record modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Anyone (public/anon) can view all products
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);

-- Authenticated admin users can insert, update, and delete products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (true);

-- 6. Enable Realtime updates on products table
ALTER TABLE public.products REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

-- 7. Storage Bucket configuration for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for 'product-images' bucket
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
CREATE POLICY "Admins upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
CREATE POLICY "Admins update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 8. Initial Curated Products Seed (Optional starter catalog for LAMIVILLE)
INSERT INTO public.products (name, description, price, category, image_url, stock_quantity, is_available)
VALUES
  (
    'LAMIVILLE Signature Abstract Silk Scarf',
    'Exquisitely draped luxury silk scarf featuring vibrant orange, royal cobalt blue, powder blue, and peach abstract brushstroke motifs. Fluid drape and elegant finish.',
    12500,
    'scarves',
    '/src/assets/images/lamiville_abstract_silk_scarf_1791313765795.jpg',
    20,
    true
  ),
  (
    'LAMIVILLE Sunset Floral Chiffon Veil',
    'Ethereal lightweight chiffon veil featuring an exquisite watercolor floral ombré design in violet, purple, deep magenta, and sunset orange. Breathable and transcendent.',
    18500,
    'veils',
    '/src/assets/images/lamiville_sunset_floral_veil_1791313777053.jpg',
    15,
    true
  ),
  (
    'Bespoke Pearl-Trimmed Bridal Veil',
    'Cathedral length heirloom tulle veil embellished with hand-placed freshwater glass pearls along the scalloped hemline. Includes a gold comb.',
    45000,
    'veils',
    '/src/assets/images/lamiville_sunset_floral_veil_1791313777053.jpg',
    6,
    true
  ),
  (
    'Matte Gold Signature Magnetic Pins (4-Pack)',
    'Ultra-strong neodymium magnetic pins designed to secure delicate chiffon and silk scarves without puncturing or snagging the fabric.',
    6500,
    'accessories',
    '/src/assets/images/lamiville_abstract_silk_scarf_1791313765795.jpg',
    40,
    true
  ),
  (
    'LAMIVILLE Signature Velvet Keepsake Box',
    'Embossed champagne gold luxury gift packaging lined with protective plush micro-velvet. Perfect for presenting scarves and veils.',
    7000,
    'others',
    '/src/assets/images/lamiville_abstract_silk_scarf_1791313765795.jpg',
    20,
    true
  )
ON CONFLICT (id) DO NOTHING;
`;
