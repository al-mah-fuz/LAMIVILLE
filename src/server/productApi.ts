import type { Request, Response } from 'express';
import { getServerSupabase, verifyAdminToken } from './supabaseAdmin';

const PRODUCT_COLUMNS = 'id, name, description, price, category, image_url, created_at';

export async function handleProducts(req: Request, res: Response) {
  const method = req.method.toUpperCase();

  try {
    // ----------------------------------------------------
    // GET: Public or admin list products
    // ----------------------------------------------------
    if (method === 'GET') {
      const { client: supabaseServer, error: clientError } = getServerSupabase();
      if (clientError || !supabaseServer) {
        return res.status(500).json({ error: clientError || 'Server client unavailable' });
      }

      const { data, error } = await supabaseServer
        .from('products')
        .select(PRODUCT_COLUMNS)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message, details: error });
      }

      return res.status(200).json({ data, error: null });
    }

    // ----------------------------------------------------
    // ADMIN ACTIONS (POST, PUT, DELETE) - Require Auth Token
    // ----------------------------------------------------
    const authHeader = req.headers.authorization;
    const { user, error: authError } = await verifyAdminToken(authHeader);
    if (authError || !user) {
      console.error('[SERVER API] Unauthorized request attempt:', authError);
      return res.status(401).json({
        error: authError || 'Unauthorized: Active admin session required. Please log in again.',
      });
    }

    const { client: supabaseServer, error: clientError } = getServerSupabase();
    if (clientError || !supabaseServer) {
      console.error('[SERVER API] Server Supabase client error:', clientError);
      return res.status(500).json({
        error: clientError || 'Server database client configuration error.',
      });
    }

    // ----------------------------------------------------
    // POST: Create New Product
    // ----------------------------------------------------
    if (method === 'POST') {
      const { name, description, price, category, image_url, image_base64, image_name } = req.body || {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Product name is required.' });
      }

      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: 'Valid positive price in Naira (₦) is required.' });
      }

      let finalImageUrl = (image_url || '').trim();

      // If client sent an image base64, upload it server-side to product-images storage
      if (image_base64 && typeof image_base64 === 'string') {
        try {
          let rawBase64 = image_base64;
          let mimeType = 'image/jpeg';
          const matches = image_base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            rawBase64 = matches[2];
          }

          const buffer = Buffer.from(rawBase64, 'base64');
          if (buffer.length > 0) {
            const ext = mimeType.split('/')[1] || 'jpg';
            const cleanName = (image_name || 'product')
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9]/g, '_')
              .slice(0, 30);
            const storagePath = `products/${Date.now()}_${cleanName}.${ext}`;

            const { error: uploadError } = await supabaseServer.storage
              .from('product-images')
              .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: false,
              });

            if (uploadError) {
              console.error('[SERVER API] Storage upload failed:', uploadError);
              return res.status(500).json({
                error: `Failed to upload product image to Supabase Storage: ${uploadError.message}`,
                details: uploadError,
              });
            }

            const { data: publicUrlData } = supabaseServer.storage
              .from('product-images')
              .getPublicUrl(storagePath);

            finalImageUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.error('[SERVER API] Image processing error:', uploadErr);
          return res.status(500).json({
            error: 'Failed to process product image data on the server.',
          });
        }
      }

      if (!finalImageUrl) {
        return res.status(400).json({ error: 'Product image is required (either image_url or image_base64).' });
      }

      // Exact columns matching public.products table schema
      const insertPayload = {
        name: name.trim(),
        description: (description || '').trim(),
        price: parsedPrice,
        category: (category || 'others').trim(),
        image_url: finalImageUrl,
      };

      console.log('[SERVER API] Performing server-side INSERT into public.products with service-role permissions');

      const { data, error: insertError } = await supabaseServer
        .from('products')
        .insert([insertPayload])
        .select(PRODUCT_COLUMNS)
        .single();

      if (insertError) {
        console.error('[SERVER API] Supabase products INSERT error:', insertError);
        return res.status(500).json({
          error: `Database INSERT failed: ${insertError.message}`,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });
      }

      console.log('[SERVER API] Product successfully created with ID:', data?.id);
      return res.status(201).json({ data, error: null });
    }

    // ----------------------------------------------------
    // PUT: Update Existing Product
    // ----------------------------------------------------
    if (method === 'PUT') {
      const id = req.params?.id || req.body?.id || (req.query?.id as string);
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required for updating.' });
      }

      const updates: Record<string, unknown> = {};
      if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
      if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
      if (req.body.price !== undefined) updates.price = Number(req.body.price);
      if (req.body.category !== undefined) updates.category = String(req.body.category).trim();
      if (req.body.image_url !== undefined) updates.image_url = String(req.body.image_url).trim();

      const { data, error: updateError } = await supabaseServer
        .from('products')
        .update(updates)
        .eq('id', id)
        .select(PRODUCT_COLUMNS)
        .single();

      if (updateError) {
        console.error('[SERVER API] Supabase products UPDATE error:', updateError);
        return res.status(500).json({
          error: `Database UPDATE failed: ${updateError.message}`,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        });
      }

      return res.status(200).json({ data, error: null });
    }

    // ----------------------------------------------------
    // DELETE: Remove Product
    // ----------------------------------------------------
    if (method === 'DELETE') {
      const id = req.params?.id || req.body?.id || (req.query?.id as string);
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required for deletion.' });
      }

      const { error: deleteError } = await supabaseServer
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[SERVER API] Supabase products DELETE error:', deleteError);
        return res.status(500).json({
          error: `Database DELETE failed: ${deleteError.message}`,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        });
      }

      return res.status(200).json({ data: true, error: null });
    }

    return res.status(405).json({ error: `Method ${method} not allowed.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SERVER API] Unhandled server error:', err);
    return res.status(500).json({
      error: `Unexpected server error: ${msg}`,
    });
  }
}
