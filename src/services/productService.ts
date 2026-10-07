import { supabase } from '../lib/supabase';
import { Product, ProductCategory } from '../types/database';
import { ensureAuthenticatedSession } from './authService';

export interface ProductFilterOptions {
  category?: ProductCategory | 'all';
  searchQuery?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export const PRODUCT_COLUMNS = 'id, name, description, price, category, image_url, created_at';

export function normalizeProduct(row: any): Product {
  return {
    id: String(row.id),
    name: row.name || 'Untitled Piece',
    description: row.description || '',
    price: Number(row.price) || 0,
    category: (row.category || 'others') as ProductCategory,
    image_url: row.image_url || '',
    created_at: row.created_at,
  };
}

/**
 * Fetch all products dynamically from the Supabase "products" table
 */
export async function getProducts(options?: ProductFilterOptions): Promise<ServiceResult<Product[]>> {
  try {
    let query = supabase.from('products').select(PRODUCT_COLUMNS);

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

    const products: Product[] = (data || []).map(normalizeProduct);

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
  try {
    const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS).eq('id', id).single();
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
 * 6. Before Add Product, calls supabase.auth.getSession() and verifies that a valid session exists.
 * 7. If the access token has expired but a refresh token exists, allows Supabase to refresh the session.
 * 8. Only displays "Session expired. Please log in again." if the session truly cannot be restored after refresh.
 * 9. The product INSERT uses the exact same shared Supabase client and authenticated session.
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at'>
): Promise<ServiceResult<Product>> {
  try {
    // 6, 7, 8: Verify valid authenticated session with automatic token refresh
    const { session, user, error: authError } = await ensureAuthenticatedSession();
    if (authError || !session || !user) {
      console.warn('Session verification failed before product insert:', authError);
      return { data: null, error: 'Session expired. Please log in again.' };
    }

    // Exact payload matching only existing columns in public.products
    const payload: Record<string, unknown> = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: Number(productData.price),
      category: productData.category,
      image_url: productData.image_url.trim(),
    };

    // 9. Product INSERT using the shared singleton Supabase client and authenticated session
    let { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select(PRODUCT_COLUMNS)
      .single();

    // If RLS rejected due to token expiry during insert, attempt refresh and retry once
    if (
      error &&
      (error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501')
    ) {
      console.warn('RLS check rejected, attempting session refresh and retry...');
      const { session: retrySession } = await ensureAuthenticatedSession();
      if (retrySession) {
        const retryRes = await supabase
          .from('products')
          .insert([payload])
          .select(PRODUCT_COLUMNS)
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }
    }

    if (error) {
      console.error('Create product error:', error);
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return { data: null, error: 'Session expired. Please log in again.' };
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
  updates: Partial<Omit<Product, 'id' | 'created_at'>>
): Promise<ServiceResult<Product>> {
  try {
    const { session, user, error: authError } = await ensureAuthenticatedSession();
    if (authError || !session || !user) {
      return { data: null, error: 'Session expired. Please log in again.' };
    }

    const cleanUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.price !== undefined) cleanUpdates.price = Number(updates.price);
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url.trim();

    let { data, error } = await supabase
      .from('products')
      .update(cleanUpdates)
      .eq('id', id)
      .select(PRODUCT_COLUMNS)
      .single();

    if (
      error &&
      (error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501')
    ) {
      const { session: retrySession } = await ensureAuthenticatedSession();
      if (retrySession) {
        const retryRes = await supabase
          .from('products')
          .update(cleanUpdates)
          .eq('id', id)
          .select(PRODUCT_COLUMNS)
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }
    }

    if (error) {
      console.error('Update product error:', error);
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return { data: null, error: 'Session expired. Please log in again.' };
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
  try {
    const { session, user, error: authError } = await ensureAuthenticatedSession();
    if (authError || !session || !user) {
      return { data: false, error: 'Session expired. Please log in again.' };
    }

    let { error } = await supabase.from('products').delete().eq('id', id);

    if (
      error &&
      (error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501')
    ) {
      const { session: retrySession } = await ensureAuthenticatedSession();
      if (retrySession) {
        const retryRes = await supabase.from('products').delete().eq('id', id);
        error = retryRes.error;
      }
    }

    if (error) {
      console.error('Delete product error:', error);
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return { data: false, error: 'Session expired. Please log in again.' };
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
