import { NextRequest } from 'next/server';
import { POST as authPostHandler, GET as authGetHandler } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return authPostHandler(req);
}

export async function GET(req: NextRequest) {
  return authGetHandler(req);
}
