import app, { ensureCatalogInitialized } from '../server.ts';

export default async function handler(req: any, res: any) {
  await ensureCatalogInitialized();
  return app(req, res);
}
