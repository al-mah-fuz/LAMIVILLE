import { getSupabase } from '../lib/supabase';
import { siteConfig } from '../config/site';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload a product image to Supabase Storage in the 'product-images' bucket
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { url: null, error: 'Supabase client is not configured' };
  }

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
    // Explicitly verify the Supabase session and authenticated user before upload
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { url: null, error: 'Please log in again.' };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { url: null, error: 'Please log in again.' };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const uniquePath = `products/${Date.now()}_${cleanFileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(siteConfig.storageBucket)
      .upload(uniquePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      if (uploadError.message.includes('bucket not found') || uploadError.message.includes('404')) {
        return {
          url: null,
          error: `Storage bucket "${siteConfig.storageBucket}" was not found. Please create a public bucket named "${siteConfig.storageBucket}" in your Supabase dashboard or run the setup SQL script.`,
        };
      }
      return { url: null, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(siteConfig.storageBucket)
      .getPublicUrl(uniquePath);

    return {
      url: publicUrlData.publicUrl,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to upload product image';
    return { url: null, error: msg };
  }
}

/**
 * Remove an image from Supabase Storage
 */
export async function deleteProductImage(imageUrl: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase || !imageUrl) {
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
