import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.mimoshow.com.br';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
