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
