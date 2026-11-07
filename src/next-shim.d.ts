declare module 'next' {
  export interface Metadata {
    title?: string | { default: string; template?: string; absolute?: string };
    description?: string;
    keywords?: string[] | string;
    robots?: any;
    openGraph?: any;
    twitter?: any;
    alternates?: any;
    metadataBase?: URL;
    icons?: any;
    [key: string]: any;
  }
  export type ResolvingMetadata = Promise<Metadata>;

  export namespace MetadataRoute {
    export type Robots = {
      rules:
        | {
            userAgent?: string | string[];
            allow?: string | string[];
            disallow?: string | string[];
            crawlDelay?: number;
          }
        | Array<{
            userAgent?: string | string[];
            allow?: string | string[];
            disallow?: string | string[];
            crawlDelay?: number;
          }>;
      sitemap?: string | string[];
      host?: string;
    };

    export type Sitemap = Array<{
      url: string;
      lastModified?: string | Date;
      changeFrequency?:
        | 'always'
        | 'hourly'
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'yearly'
        | 'never';
      priority?: number;
      alternates?: {
        languages?: Record<string, string>;
      };
      [key: string]: any;
    }>;
  }
}

declare module 'next/server' {
  export class NextRequest extends Request {
    readonly nextUrl: URL;
    readonly ip?: string;
    readonly geo?: {
      city?: string;
      country?: string;
      region?: string;
      latitude?: string;
      longitude?: string;
    };
    readonly cookies: any;
    constructor(input: RequestInfo | URL, init?: RequestInit);
  }

  export class NextResponse<Body = unknown> extends Response {
    static json<JsonBody = any>(body: JsonBody, init?: ResponseInit): NextResponse<JsonBody>;
    static redirect(url: string | URL | Location, status?: number): NextResponse<never>;
    static rewrite(destination: string | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
    readonly cookies: any;
  }
}

declare module 'next/link' {
  import type * as React from 'react';
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
  }
  const Link: React.ForwardRefExoticComponent<React.PropsWithoutRef<LinkProps> & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module 'next/navigation' {
  export function notFound(): never;
  export function redirect(url: string, type?: 'replace' | 'push'): never;
  export function useRouter(): {
    push(href: string, options?: any): void;
    replace(href: string, options?: any): void;
    refresh(): void;
    back(): void;
    forward(): void;
    prefetch(href: string): void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string | string[]>>(): T;
}

declare module 'next/headers' {
  export function headers(): Promise<Headers> & Headers;
  export function cookies(): Promise<any> & any;
}

declare module 'next/script' {
  import type * as React from 'react';
  export interface ScriptProps extends React.ScriptHTMLAttributes<HTMLScriptElement> {
    strategy?: 'afterInteractive' | 'beforeInteractive' | 'lazyOnload' | 'worker';
    id?: string;
    onLoad?: () => void;
    onError?: () => void;
  }
  const Script: React.FC<ScriptProps>;
  export default Script;
}

declare module 'next/image' {
  import type * as React from 'react';
  export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number | `${number}`;
    height?: number | `${number}`;
    fill?: boolean;
    priority?: boolean;
    quality?: number | `${number}`;
    sizes?: string;
    unoptimized?: boolean;
  }
  const Image: React.FC<ImageProps>;
  export default Image;
}

declare module 'next/dynamic' {
  import type * as React from 'react';
  export interface DynamicOptions<P = {}> {
    loading?: () => React.ReactNode;
    ssr?: boolean;
  }
  export default function dynamic<P = {}>(
    loader: () => Promise<React.ComponentType<P> | { default: React.ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): React.ComponentType<P>;
}
