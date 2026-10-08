import { supabase, formatSupabaseError } from '../lib/supabase';
import { Product, ProductCategory } from '../types/database';

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
        error: formatSupabaseError(error),
      };
    }

    const products: Product[] = (data || []).map(normalizeProduct);

    return {
      data: products,
      error: null,
    };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    console.error('getProducts error:', formatted);
    return { data: null, error: formatted };
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<ServiceResult<Product>> {
  try {
    const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS).eq('id', id).single();
    if (error) {
      return { data: null, error: formatSupabaseError(error) };
    }
    return { data: normalizeProduct(data), error: null };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    return { data: null, error: formatted };
  }
}

/**
 * Create a new product (Admin action)
 * Saves product name, description, price, category, and image_url to the "products" table.
 * Explicitly verifies the session and user with full logging.
 * Only returns "Session expired. Please log in again." if there is genuinely no session.
 * For all database, RLS, schema, and network errors, returns the REAL Supabase error.
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at'>
): Promise<ServiceResult<Product>> {
  try {
    // 1. Explicitly check session
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      const formatted = formatSupabaseError(sessionError);
      console.error('[ADD PRODUCT] SESSION ERROR:', sessionError);
      console.error('[ADD PRODUCT] ERROR:', formatted);
      return { data: null, error: formatted };
    }

    // If access token has expired but a refresh token exists, allow Supabase to refresh the session
    if (!session) {
      console.log('[ADD PRODUCT] No session from getSession(), attempting refreshSession()...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[ADD PRODUCT] refreshSession error:', refreshError);
      }
      session = refreshData?.session || null;
    }

    console.log('[ADD PRODUCT] session exists:', !!session);
    console.log('[ADD PRODUCT] user id:', session?.user?.id);
    console.log('[ADD PRODUCT] user email:', session?.user?.email);

    if (!session) {
      console.error('[ADD PRODUCT] SESSION: No session found after refresh attempt');
      console.error('[ADD PRODUCT] ERROR: Session expired. Please log in again.');
      return { data: null, error: 'Session expired. Please log in again.' };
    }

    console.error('[ADD PRODUCT] SESSION: Active session verified for user:', session.user?.email || session.user?.id);

    // 2. Explicitly check user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      const formatted = formatSupabaseError(userError);
      console.error('[ADD PRODUCT] USER ERROR:', userError);
      console.error('[ADD PRODUCT] ERROR:', formatted);
      return { data: null, error: formatted };
    }

    if (!user) {
      console.error('[ADD PRODUCT] USER: No user found');
      console.error('[ADD PRODUCT] ERROR: Session expired. Please log in again.');
      return { data: null, error: 'Session expired. Please log in again.' };
    }

    console.error('[ADD PRODUCT] USER: Authenticated user confirmed:', user.id, user.email);

    // Exact payload matching only existing columns in public.products
    const payload: Record<string, unknown> = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: Number(productData.price),
      category: productData.category,
      image_url: productData.image_url.trim(),
    };

    console.log('[ADD PRODUCT] Sending product creation payload to secure server API (/api/products)...');

    // 3. Product INSERT via secure server-side endpoint with verified admin Bearer JWT
    // The server verifies the token with Supabase Auth and inserts using the server-side client
    const token = session.access_token;
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json().catch(() => null);

      if (response.ok && resJson?.data) {
        console.log('[ADD PRODUCT] Server-side product creation successful, row ID:', resJson.data.id);
        return { data: normalizeProduct(resJson.data), error: null };
      }

      if (resJson?.error) {
        const errorMsg = resJson.error;
        console.error('[ADD PRODUCT] Server API returned error:', errorMsg);
        return { data: null, error: errorMsg };
      }
    } catch (fetchErr) {
      console.warn('[ADD PRODUCT] Server endpoint unreachable, checking direct fallback:', fetchErr);
    }

    // Direct fallback (only if server endpoint is completely unreachable)
    const { data, error: insertError } = await supabase
      .from('products')
      .insert([payload])
      .select(PRODUCT_COLUMNS)
      .single();

    if (insertError) {
      const formatted = formatSupabaseError(insertError);
      console.error('[ADD PRODUCT] Direct INSERT fallback error:', insertError);
      return { data: null, error: formatted };
    }

    return { data: normalizeProduct(data), error: null };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    console.error('[ADD PRODUCT] DATABASE INSERT UNCAUGHT ERROR:', err);
    return { data: null, error: formatted };
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
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { data: null, error: formatSupabaseError(sessionError) };
    if (!session) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      session = refreshData?.session || null;
    }
    if (!session) return { data: null, error: 'Session expired. Please log in again.' };

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) return { data: null, error: formatSupabaseError(userError) };
    if (!user) return { data: null, error: 'Session expired. Please log in again.' };

    const cleanUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.price !== undefined) cleanUpdates.price = Number(updates.price);
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url.trim();

    const token = session.access_token;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanUpdates),
      });

      const resJson = await response.json().catch(() => null);

      if (response.ok && resJson?.data) {
        return { data: normalizeProduct(resJson.data), error: null };
      }

      if (resJson?.error) {
        return { data: null, error: resJson.error };
      }
    } catch (fetchErr) {
      console.warn('Server update route unreachable, attempting direct fallback:', fetchErr);
    }

    const { data, error: updateError } = await supabase
      .from('products')
      .update(cleanUpdates)
      .eq('id', id)
      .select(PRODUCT_COLUMNS)
      .single();

    if (updateError) {
      const formatted = formatSupabaseError(updateError);
      console.error('Update product error:', updateError);
      return { data: null, error: formatted };
    }

    return { data: normalizeProduct(data), error: null };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    return { data: null, error: formatted };
  }
}

/**
 * Delete a product (Admin action)
 */
export async function deleteProduct(id: string): Promise<ServiceResult<boolean>> {
  try {
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { data: false, error: formatSupabaseError(sessionError) };
    if (!session) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      session = refreshData?.session || null;
    }
    if (!session) return { data: false, error: 'Session expired. Please log in again.' };

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) return { data: false, error: formatSupabaseError(userError) };
    if (!user) return { data: false, error: 'Session expired. Please log in again.' };

    // Perform direct deletion using the shared authenticated Supabase client
    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);

    if (deleteError) {
      const formatted = formatSupabaseError(deleteError);
      console.error('Delete product error:', deleteError);
      return { data: false, error: formatted };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    return { data: false, error: formatted };
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
