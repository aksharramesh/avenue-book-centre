import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.avenuebookcentre.com'; // Default production domain

  // Fetch all active products
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, updatedAt: true }
  });

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: { id: true, updatedAt: true }
  });

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: p.updatedAt,
  }));

  const categoryUrls = categories.map((c) => ({
    url: `${baseUrl}/products?category=${c.id}`,
    lastModified: c.updatedAt,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...categoryUrls.map((item) => ({
      url: item.url,
      lastModified: item.lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...productUrls.map((item) => ({
      url: item.url,
      lastModified: item.lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
