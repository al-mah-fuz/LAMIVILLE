import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleProducts } from './src/server/productApi';
import { handleUploadImage } from './src/server/uploadApi';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 15MB for base64 image data
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Backend API routes for product creation, management, and storage uploads
  app.all('/api/products', handleProducts);
  app.all('/api/products/:id', handleProducts);
  app.all('/api/create-product', handleProducts);
  app.all('/api/admin/create-product', handleProducts);
  app.all('/api/upload-image', handleUploadImage);

  if (!isProd) {
    // Development mode: Mount Vite middlewares into Express
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve compiled assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Lamiville server running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Startup failed:', err);
  process.exit(1);
});
