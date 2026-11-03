declare module 'next/server' {
  export class NextRequest extends Request {
    nextUrl: URL;
    geo?: {
      city?: string;
      country?: string;
      region?: string;
      latitude?: string;
      longitude?: string;
    };
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
    };
  }

  export class NextResponse extends Response {
    static next(init?: { request?: { headers?: Headers } }): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static json(body: any, init?: ResponseInit): NextResponse;
    cookies: {
      set(
        name: string,
        value: string,
        options?: {
          path?: string;
          maxAge?: number;
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: 'lax' | 'strict' | 'none';
        }
      ): void;
    };
  }
}
