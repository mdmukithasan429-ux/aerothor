import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCjProductToGmc,
  mapGenericApiProductToGmc,
  parseCjPrice,
  sanitizeGmcTitle,
  SAMPLE_CJ_RAW_PRODUCTS,
} from './api-integrations';

test('parseCjPrice handles numeric and string ranges', () => {
  assert.equal(parseCjPrice(14.5), 14.5);
  assert.equal(parseCjPrice('14.50'), 14.5);
  assert.equal(parseCjPrice('12.50 -- 18.00'), 12.5);
  assert.equal(parseCjPrice('$24.99 USD'), 24.99);
  assert.equal(parseCjPrice('invalid'), 19.99);
});

test('sanitizeGmcTitle removes Chinese characters and limits length', () => {
  const dirty = '跨境爆款 40oz Vacuum Insulated Tumbler 杯子 Stainless Steel';
  const clean = sanitizeGmcTitle(dirty);
  assert.equal(clean.includes('跨境爆款'), false);
  assert.equal(clean.includes('杯子'), false);
  assert.ok(clean.length <= 150);
});

test('mapCjProductToGmc correctly formats Google Merchant Center attributes', () => {
  const sample = SAMPLE_CJ_RAW_PRODUCTS[0];
  const gmc = mapCjProductToGmc(sample, {
    markupMultiplier: 2.5,
    currency: 'USD',
    defaultBrand: 'AeroThor',
    targetMarket: 'US',
  });

  // Check essential GMC fields
  assert.equal(gmc.id, 'CJ-CJ-TUMB-40OZ-BLK');
  assert.ok(gmc.title.includes('40oz Vacuum Insulated'));
  assert.ok(gmc.price.includes('USD'));
  // Wholesale $14.50 * 2.5 = $36.25 USD
  assert.equal(gmc.price, '36.25 USD');
  assert.equal(gmc.sale_price, '31.90 USD');
  assert.equal(gmc.availability, 'in_stock');
  assert.equal(gmc.condition, 'new');
  assert.equal(gmc.brand, 'AeroThor');
  assert.ok(gmc.image_link.startsWith('http'));
  assert.equal(gmc.shipping?.[0]?.country, 'US');
  assert.equal(gmc.shipping?.[0]?.service, 'USPS Priority 2-Day');
});

test('mapGenericApiProductToGmc maps custom platform attributes dynamically', () => {
  const customSupplierItem = {
    item_code: 'ZEND-98214',
    item_name: 'Aerospace Carbon Fiber Minimalist Cardholder Wallet',
    cost: '18.00',
    cover_image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
    details: 'RFID blocking carbon fiber plate wallet.',
    brand_name: 'ApexTactical',
  };

  const gmc = mapGenericApiProductToGmc(
    customSupplierItem,
    {
      platformName: 'Zendrop',
      endpointUrl: 'https://api.zendrop.com/v2/products',
      authHeaderName: 'Authorization',
      idPath: 'item_code',
      titlePath: 'item_name',
      pricePath: 'cost',
      descriptionPath: 'details',
      imagePath: 'cover_image',
      brandPath: 'brand_name',
    },
    {
      markupMultiplier: 2.5,
      currency: 'USD',
    }
  );

  assert.equal(gmc.id, 'ZEN-ZEND-98214');
  assert.equal(gmc.title, 'Aerospace Carbon Fiber Minimalist Cardholder Wallet');
  // Cost $18.00 * 2.5 = $45.00 USD
  assert.equal(gmc.price, '45.00 USD');
  assert.equal(gmc.brand, 'ApexTactical');
  assert.equal(gmc.availability, 'in_stock');
});
