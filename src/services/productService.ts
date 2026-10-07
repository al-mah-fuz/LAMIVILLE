import { getSupabase } from '../lib/supabase';
import { Product, ProductCategory } from '../types/database';

export interface ProductFilterOptions {
  category?: ProductCategory | 'all';
  searchQuery?: string;
  onlyAvailable?: boolean;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export function normalizeProduct(row: any): Product {
  return {
    id: String(row.id),
    name: row.name || 'Untitled Piece',
    description: row.description || '',
    price: Number(row.price) || 0,
    category: (row.category || 'others') as ProductCategory,
    image_url: row.image_url || '',
    images: row.images || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    stock_quantity: row.stock_quantity !== undefined ? Number(row.stock_quantity) : 10,
    is_available: row.is_available !== undefined ? Boolean(row.is_available) : true,
  };
}

/**
 * Fetch all products dynamically from the Supabase "products" table
 */
export async function getProducts(options?: ProductFilterOptions): Promise<ServiceResult<Product[]>> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      error: 'Supabase client is not configured.',
    };
  }

  try {
    let query = supabase.from('products').select('*');

    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    if (options?.searchQuery && options.searchQuery.trim()) {
      const q = `%${options.searchQuery.trim()}%`;
      query = query.or(`name.ilike.${q},description.ilike.${q}`);
    }

    // Sorting
    switch (options?.sortBy) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name-asc':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    let products: Product[] = (data || []).map(normalizeProduct);

    if (options?.onlyAvailable) {
      products = products.filter((p) => p.is_available && p.stock_quantity > 0);
    }

    return {
      data: products,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve products';
    return { data: null, error: msg };
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<ServiceResult<Product>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: normalizeProduct(data), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve product';
    return { data: null, error: msg };
  }
}

/**
 * Create a new product (Admin action)
 * Saves product name, description, price, category, and image_url to the "products" table.
 * Explicitly verifies the Supabase session and authenticated user before products.insert().
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceResult<Product>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    // 1. Explicitly verify active Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.warn('No active Supabase session found before insert:', sessionError);
      return { data: null, error: 'Please log in again.' };
    }

    // 2. Explicitly verify real authenticated Supabase user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('Authenticated user verification failed before insert:', userError);
      return { data: null, error: 'Please log in again.' };
    }

    const payload: Record<string, unknown> = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: Number(productData.price),
      category: productData.category,
      image_url: productData.image_url,
      images: productData.images || [],
      stock_quantity: Math.max(0, Number(productData.stock_quantity ?? 10)),
      is_available: productData.is_available !== undefined ? Boolean(productData.is_available) : true,
    };

    // 3. Product INSERT using the verified authenticated client session
    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return { data: null, error: 'Please log in again.' };
      }
      return { data: null, error: error.message };
    }

    return { data: normalizeProduct(data), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create product';
    return { data: null, error: msg };
  }
}

/**
 * Update an existing product (Admin action)
 */
export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<ServiceResult<Product>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    // 1. Explicitly verify active Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { data: null, error: 'Please log in again.' };
    }

    // 2. Explicitly verify real authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: 'Please log in again.' };
    }

    const cleanUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.price !== undefined) cleanUpdates.price = Number(updates.price);
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url;
    if (updates.images !== undefined) cleanUpdates.images = updates.images;
    if (updates.stock_quantity !== undefined) cleanUpdates.stock_quantity = Math.max(0, Number(updates.stock_quantity));
    if (updates.is_available !== undefined) cleanUpdates.is_available = Boolean(updates.is_available);

    const { data, error } = await supabase
      .from('products')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return { data: null, error: 'Please log in again.' };
      }
      return { data: null, error: error.message };
    }

    return { data: normalizeProduct(data), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update product';
    return { data: null, error: msg };
  }
}

/**
 * Delete a product (Admin action)
 */
export async function deleteProduct(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    // 1. Explicitly verify active Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { data: false, error: 'Please log in again.' };
    }

    // 2. Explicitly verify real authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: false, error: 'Please log in again.' };
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('Delete product error:', error);
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return { data: false, error: 'Please log in again.' };
      }
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete product';
    return { data: false, error: msg };
  }
}

/**
 * Realtime subscription to the 'products' table.
 * Listens for INSERT, UPDATE, and DELETE events and calls the callback.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToProducts(
  onEvent: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    newProduct: Product | null;
    oldProduct: Product | null;
  }) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  const channelId = `realtime-products-${Date.now()}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
      },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const newProduct = payload.new ? normalizeProduct(payload.new) : null;
        const oldProduct = payload.old ? normalizeProduct(payload.old) : null;

        onEvent({
          eventType,
          newProduct,
          oldProduct,
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('⚡ Supabase Realtime connected for LAMIVILLE products');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
