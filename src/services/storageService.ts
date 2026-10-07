import { supabase, formatSupabaseError } from '../lib/supabase';
import { siteConfig } from '../config/site';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload a product image to Supabase Storage in the 'product-images' bucket
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return {
      url: null,
      error: 'Please upload a valid image file (JPG, PNG, or WebP).',
    };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      url: null,
      error: 'Image size exceeds 5MB limit. Please choose a smaller photo.',
    };
  }

  try {
    // Check session explicitly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      const formatted = formatSupabaseError(sessionError);
      console.error('[ADD PRODUCT] IMAGE UPLOAD SESSION ERROR:', sessionError);
      console.error('[ADD PRODUCT] ERROR:', formatted);
      return { url: null, error: formatted };
    }
    if (!session) {
      console.error('[ADD PRODUCT] IMAGE UPLOAD: No session found');
      console.error('[ADD PRODUCT] ERROR: Session expired. Please log in again.');
      return { url: null, error: 'Session expired. Please log in again.' };
    }

    // Check user explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      const formatted = formatSupabaseError(userError);
      console.error('[ADD PRODUCT] IMAGE UPLOAD USER ERROR:', userError);
      console.error('[ADD PRODUCT] ERROR:', formatted);
      return { url: null, error: formatted };
    }
    if (!user) {
      console.error('[ADD PRODUCT] IMAGE UPLOAD: No user found');
      console.error('[ADD PRODUCT] ERROR: Session expired. Please log in again.');
      return { url: null, error: 'Session expired. Please log in again.' };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const uniquePath = `products/${Date.now()}_${cleanFileName}.${fileExt}`;

    console.error('[ADD PRODUCT] IMAGE UPLOAD: Starting upload to bucket', siteConfig.storageBucket, uniquePath);

    const { error: uploadError } = await supabase.storage
      .from(siteConfig.storageBucket)
      .upload(uniquePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      const formatted = formatSupabaseError(uploadError);
      console.error('[ADD PRODUCT] IMAGE UPLOAD ERROR:', uploadError);
      console.error('[ADD PRODUCT] ERROR:', formatted);
      return { url: null, error: formatted };
    }

    const { data: publicUrlData } = supabase.storage
      .from(siteConfig.storageBucket)
      .getPublicUrl(uniquePath);

    console.error('[ADD PRODUCT] IMAGE URL:', publicUrlData.publicUrl);

    return {
      url: publicUrlData.publicUrl,
      error: null,
    };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    console.error('[ADD PRODUCT] IMAGE UPLOAD UNCAUGHT ERROR:', err);
    console.error('[ADD PRODUCT] ERROR:', formatted);
    return { url: null, error: formatted };
  }
}

/**
 * Remove an image from Supabase Storage
 */
export async function deleteProductImage(imageUrl: string): Promise<{ success: boolean; error: string | null }> {
  if (!imageUrl) {
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    // Only attempt deletion if it's stored on this Supabase project
    const bucketMarker = `/${siteConfig.storageBucket}/`;
    if (!imageUrl.includes(bucketMarker)) {
      // It might be an external photo URL (e.g. Unsplash sample), nothing to delete in bucket
      return { success: true, error: null };
    }

    const parts = imageUrl.split(bucketMarker);
    if (parts.length < 2) {
      return { success: true, error: null };
    }
    const relativePath = decodeURIComponent(parts[1].split('?')[0]);

    const { error } = await supabase.storage.from(siteConfig.storageBucket).remove([relativePath]);
    if (error) {
      console.warn('Storage image deletion warning:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove image from storage';
    return { success: false, error: msg };
  }
}
