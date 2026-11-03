import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prisma from '../lib/prisma';

async function main() {
  console.log('1. Generating clean 1,000-product catalog and wiping old static mock items...');
  execSync('node scripts/seed-clean-catalog.cjs', { stdio: 'inherit' });

  const catalogPath = path.resolve(process.cwd(), 'data', 'catalog-db.json');
  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  try {
    console.log('2. Wiping legacy Product & Variant rows in PostgreSQL...');
    await prisma.variant.deleteMany({});
    await prisma.product.deleteMany({});

    console.log(`3. Seeding ${rawCatalog.length} curated products into PostgreSQL...`);
    for (const item of rawCatalog) {
      const numPrice = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 29.99;
      const numSale = item.sale_price
        ? parseFloat(String(item.sale_price).replace(/[^0-9.]/g, ''))
        : null;

      await prisma.product.create({
        data: {
          sku: item.id,
          cjPid: item.cj_pid || null,
          cjVid: item.cj_vid || null,
          cjSku: item.cj_sku || item.id,
          title: item.title,
          description: item.description,
          price: numPrice,
          salePrice: numSale,
          wholesalePrice: item.wholesale_price ?? Number((numPrice * 0.36).toFixed(2)),
          mainImageUrl: item.image_link,
          brand: item.brand || 'AeroThor',
          gtin: item.gtin || null,
          mpn: item.mpn || item.id,
          productType: item.productType === 'affiliate' ? 'affiliate' : item.product_type || 'dropshipping',
          affiliateUrl: item.affiliateUrl || null,
          isFreeShipping: item.isFreeShipping !== false,
          shippingCost: Number(item.shippingCost || 0),
          stockQuantity: 100,
          availability: 'in_stock',
          isVisible: true,
          status: 'active',
        },
      });
    }
    console.log('PostgreSQL database seed completed.');
  } catch (err: any) {
    console.warn('Prisma DB not reachable during seed; local JSON persistence (/data/catalog-db.json) is up to date:', err.message);
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
