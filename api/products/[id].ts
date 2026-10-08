import { handleProducts } from '../../src/server/productApi.js';

export default async function handler(req: any, res: any) {
  // Handle CORS preflight if invoked directly
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  return handleProducts(req, res);
}
