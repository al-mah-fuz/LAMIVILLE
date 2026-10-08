import type { Request, Response } from 'express';
import { getServerSupabase, verifyAdminToken } from './supabaseAdmin';

export async function handleUploadImage(req: Request, res: Response) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // 1. Verify authenticated admin session
    const authHeader = req.headers.authorization;
    const { user, error: authError } = await verifyAdminToken(authHeader);
    if (authError || !user) {
      return res.status(401).json({
        error: authError || 'Unauthorized: Invalid admin session. Please log in again.',
      });
    }

    // 2. Parse image payload
    const { image_base64, filename, contentType } = req.body || {};
    if (!image_base64 || typeof image_base64 !== 'string') {
      return res.status(400).json({ error: 'Missing image_base64 in request body.' });
    }

    // Extract raw base64 data and mime type
    let rawBase64 = image_base64;
    let mimeType = contentType || 'image/jpeg';

    const matches = image_base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty image file data.' });
    }

    // Validate size (max 8MB)
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds 8MB limit. Please choose a smaller photo.' });
    }

    // 3. Obtain server Supabase client
    const { client: supabaseServer, error: clientError } = getServerSupabase();
    if (clientError || !supabaseServer) {
      return res.status(500).json({ error: clientError || 'Server database client unavailable.' });
    }

    // Generate storage path
    const ext = mimeType.split('/')[1] || 'jpg';
    const cleanName = (filename || 'image')
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
      return res.status(500).json({
        error: `Supabase Storage upload failed: ${uploadError.message}`,
        details: uploadError,
      });
    }

    const { data: urlData } = supabaseServer.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    return res.status(200).json({
      url: urlData.publicUrl,
      error: null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: `Server error during image upload: ${msg}`,
    });
  }
}
