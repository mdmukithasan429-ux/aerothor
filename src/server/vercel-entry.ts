process.env.VERCEL = '1';

import app, { ensureCatalogInitialized } from '../../server';

export default async function handler(req: any, res: any) {
  await ensureCatalogInitialized();
  return app(req, res);
}
