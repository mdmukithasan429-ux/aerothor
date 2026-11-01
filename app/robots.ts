import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerothor.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/product/', '/deals', '/affiliates', '/return-policy', '/policies/'],
        disallow: ['/admin/', '/api/admin/'],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/api/sitemap.xml`],
    host: BASE_URL,
  };
}
