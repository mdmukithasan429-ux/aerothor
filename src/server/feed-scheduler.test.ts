import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeFeedRefresh,
  getMsUntilNextMidnightUtc,
  getFeedSchedulerStatus,
  getCachedFeed,
} from './feed-scheduler.js';
import { GmcProduct } from '../lib/gmc-feed.js';

const mockCatalog: GmcProduct[] = [
  {
    id: 'TEST-SKU-001',
    title: 'Aero Ultra-Light Titanium Hydration Bottle 750ml',
    description: 'High-grade aerospace titanium water bottle for active sports and EDC travel.',
    link: 'https://ais-dev-3nqmvpugp7tuj6tqdspsbn-806254583049.asia-northeast1.run.app/product/TEST-SKU-001',
    image_link: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    price: '48.00 USD',
    availability: 'in_stock',
    brand: 'AeroThor',
    condition: 'new',
    identifier_exists: true,
    mpn: 'TEST-SKU-001',
  },
  {
    id: 'TEST-SKU-002',
    title: 'Carbon Minimalist Wallet RFID Protected',
    description: 'Ultra-slim carbon fiber cardholder with money clip and RFID blocking.',
    link: 'https://ais-dev-3nqmvpugp7tuj6tqdspsbn-806254583049.asia-northeast1.run.app/product/TEST-SKU-002',
    image_link: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    price: '34.50 USD',
    availability: 'out_of_stock',
    brand: 'AeroThor',
    condition: 'new',
    identifier_exists: true,
    mpn: 'TEST-SKU-002',
  },
];

test('getMsUntilNextMidnightUtc calculates positive ms until midnight', () => {
  const ms = getMsUntilNextMidnightUtc();
  assert.ok(ms > 0, 'ms should be greater than 0');
  assert.ok(ms <= 24 * 60 * 60 * 1000 + 1000, 'ms should not exceed 24 hours');
});

test('executeFeedRefresh generates valid XML and updates cache and logs', () => {
  const log = executeFeedRefresh(mockCatalog, 'automated_daily');

  assert.strictEqual(log.totalProducts, 2);
  assert.strictEqual(log.inStockCount, 1);
  assert.strictEqual(log.outOfStockCount, 1);
  assert.strictEqual(log.trigger, 'automated_daily');
  assert.ok(log.qualityScore >= 90, 'Compliant products should have high quality score');
  assert.ok(log.feedSizeBytes > 500, 'Feed size should be greater than 500 bytes');

  const { xml, lastBuildDate, score } = getCachedFeed();
  assert.ok(xml.includes('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'));
  assert.ok(xml.includes('<g:id>TEST-SKU-001</g:id>'));
  assert.ok(xml.includes('<g:availability>in_stock</g:availability>'));
  assert.ok(xml.includes('<g:id>TEST-SKU-002</g:id>'));
  assert.ok(xml.includes('<g:availability>out_of_stock</g:availability>'));
  assert.ok(Boolean(lastBuildDate));
  assert.strictEqual(score, log.qualityScore);
});

test('getFeedSchedulerStatus provides accurate metrics and upcoming scheduled run', () => {
  const status = getFeedSchedulerStatus(mockCatalog);

  assert.strictEqual(status.isSchedulerActive, true);
  assert.strictEqual(status.intervalHours, 24);
  assert.strictEqual(status.totalProducts, 2);
  assert.strictEqual(status.inStockCount, 1);
  assert.strictEqual(status.outOfStockCount, 1);
  assert.ok(status.logs.length > 0);
  assert.strictEqual(status.feedUrl, '/api/feed.xml');
});
