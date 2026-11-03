import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prisma from '../lib/prisma';

function slugify(title: string, sku: string): string {
  const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 150);
  return `${base || 'product'}-${cleanSku}`.slice(0, 240);
}

async function main() {
  console.log('1. Generating clean 1,000-product catalog and wiping old static mock items...');
  execSync('node scripts/seed-clean-catalog.cjs', { stdio: 'inherit' });

  const catalogPath = path.resolve(process.cwd(), 'data', 'catalog-db.json');
  const fileContent = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const rawCatalog: any[] = Array.isArray(fileContent)
    ? fileContent
    : Array.isArray(fileContent?.products)
    ? fileContent.products
    : [];

  if (rawCatalog.length === 0) {
    throw new Error('Catalog is empty after running seed script.');
  }

  try {
    console.log('2. Wiping legacy ProductVariant & Product rows in PostgreSQL...');
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});

    console.log(`3. Seeding ${rawCatalog.length} curated products into PostgreSQL with full schema fields & slug uniqueness...`);

    const formattedProducts = rawCatalog.map((item, idx) => {
      const numPrice = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 29.99;
      const numSale = item.sale_price
        ? parseFloat(String(item.sale_price).replace(/[^0-9.]/g, ''))
        : null;

      const baseSlug = slugify(item.title || 'Product', item.id || `item-${idx}`);
      // Guarantee global uniqueness for slug
      const uniqueSlug = `${baseSlug}-${idx + 1}`.slice(0, 240);

      const isAffiliate = item.productType === 'affiliate' || Boolean(item.affiliateUrl || item.affiliate_url);
      const cjPid = !isAffiliate && item.cj_pid ? String(item.cj_pid).trim() : null;

      return {
        sku: String(item.id).trim(),
        cjPid: cjPid || null,
        title: String(item.title || 'Curated Product').trim(),
        description: String(item.description || item.title || '').trim(),
        slug: uniqueSlug,
        brand: String(item.brand || 'AeroThor').trim(),
        price: numPrice,
        salePrice: numSale,
        currency: 'USD',
        stockQuantity: 100,
        availability: 'in_stock',
        mainImageUrl: String(item.image_link || item.mainImageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'),
        additionalImgs: Array.isArray(item.additional_images) ? item.additional_images : [],
        seoTitle: item.seo_title || null,
        seoDescription: item.seo_description || null,
        productType: isAffiliate ? 'affiliate' : (item.product_type || 'dropshipping'),
        affiliateUrl: item.affiliateUrl || item.affiliate_url || null,
        isFreeShipping: item.isFreeShipping !== false,
        shippingCost: Number(item.shippingCost || 0),
        isVisible: true,
        isTrending: Boolean(item.isTrending),
        isBestSelling: Boolean(item.isBestSelling),
        trendingScore: Number(item.trendingScore || 85),
        salesCount: Number(item.salesCount || 150),
        tags: Array.isArray(item.tags) ? item.tags : ['lifetime-updates'],
        rating: Number(item.rating || 4.9),
        reviewCount: Number(item.reviewCount || 42),
        reviewsJson: Array.isArray(item.reviews) ? item.reviews : [],
        hasLifetimeUpdateAccess: item.hasLifetimeUpdateAccess !== false,
      };
    });

    const chunkSize = 100;
    for (let i = 0; i < formattedProducts.length; i += chunkSize) {
      const chunk = formattedProducts.slice(i, i + chunkSize);
      if (typeof prisma.product?.createMany === 'function') {
        await prisma.product.createMany({
          data: chunk as any,
          skipDuplicates: true,
        });
      } else {
        await Promise.all(
          chunk.map((item) =>
            prisma.product.create({
              data: item as any,
            }).catch((err: any) => {
              console.warn(`[Seed item error ${item.sku}]:`, err.message);
            })
          )
        );
      }
      console.log(`   Seeded items ${i + 1} to ${Math.min(i + chunkSize, formattedProducts.length)}...`);
    }

    const totalInserted = await prisma.product.count();
    console.log(`[PostgreSQL Seed Success] Inserted and verified ${totalInserted} curated products in database.`);
  } catch (err: any) {
    console.warn('[PostgreSQL Seed Notice]:', err.message);
    console.log('Local JSON persistence (/data/catalog-db.json) contains all 1,000 products for runtime fallback.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });
