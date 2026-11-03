import { MetadataRoute } from 'next';

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  'https://aerothor.smmgrows.com'
).replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/product/',
          '/deals',
          '/deals/us',
          '/deals/uk',
          '/affiliates',
          '/return-policy',
          '/policies/',
          '/api/feed.xml',
        ],
        disallow: ['/admin/', '/api/admin/', '/api/webhooks/', '/checkout/'],
      },
      {
        userAgent: ['Baiduspider', 'YandexBot', 'Sogou', 'Bytespider', 'PetalBot'],
        disallow: ['/'],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/api/sitemap.xml`],
    host: BASE_URL,
  };
}
