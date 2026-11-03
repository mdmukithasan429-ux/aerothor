import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRealTimeTrafficDataset,
  buildRealCommissionLedgerFromOrders,
} from './real-time-metrics';

test('buildRealTimeTrafficDataset defaults strictly to 0 when no telemetry events exist', () => {
  const result = buildRealTimeTrafficDataset(14, []);
  assert.equal(result.totalVisitors, 0);
  assert.equal(result.totalAffiliateClickouts, 0);
  assert.equal(result.dailyTraffic.length, 14);
  for (const row of result.dailyTraffic) {
    assert.equal(row.totalVisitors, 0);
    assert.equal(row.organicSearchVisitors, 0);
    assert.equal(row.affiliateClicks, 0);
    assert.equal(row.US, 0);
    assert.equal(row.GB, 0);
  }
  for (const reg of result.regionalBreakdown) {
    assert.equal(reg.visitors, 0);
    assert.equal(reg.affiliateClickouts, 0);
    assert.equal(reg.organicSharePercent, 0);
    assert.equal(reg.conversionRatePercent, 0);
  }
});

test('buildRealTimeTrafficDataset aggregates real recorded page views and affiliate clicks accurately', () => {
  const fixedNow = new Date('2026-11-02T12:00:00.000Z');
  const todayKey = '2026-11-02';
  const result = buildRealTimeTrafficDataset(
    14,
    [
      { timestamp: fixedNow.toISOString(), dateKey: todayKey, isoCode: 'US', type: 'page_view' },
      { timestamp: fixedNow.toISOString(), dateKey: todayKey, isoCode: 'US', type: 'organic_visit' },
      { timestamp: fixedNow.toISOString(), dateKey: todayKey, isoCode: 'GB', type: 'affiliate_click' },
    ],
    fixedNow
  );

  assert.equal(result.totalVisitors, 2);
  assert.equal(result.totalAffiliateClickouts, 1);

  const todayRow = result.dailyTraffic[result.dailyTraffic.length - 1];
  assert.equal(todayRow.date, todayKey);
  assert.equal(todayRow.totalVisitors, 2);
  assert.equal(todayRow.organicSearchVisitors, 1);
  assert.equal(todayRow.affiliateClicks, 1);
  assert.equal(todayRow.US, 2);

  const usRegion = result.regionalBreakdown.find((r) => r.isoCode === 'US');
  const gbRegion = result.regionalBreakdown.find((r) => r.isoCode === 'GB');
  assert.equal(usRegion?.visitors, 2);
  assert.equal(usRegion?.organicSharePercent, 50);
  assert.equal(gbRegion?.affiliateClickouts, 1);
});

test('buildRealCommissionLedgerFromOrders returns empty array when no orders exist', () => {
  const ledger = buildRealCommissionLedgerFromOrders([], []);
  assert.deepEqual(ledger, []);
});

test('buildRealCommissionLedgerFromOrders calculates exact wholesale and shipping deductions from real orders', () => {
  const ledger = buildRealCommissionLedgerFromOrders(
    [
      {
        id: 'ORD-REAL-101',
        orderNumber: 'ORD-REAL-101',
        totalAmount: 100,
        paymentStatus: 'paid',
        createdAt: '2026-11-02T10:00:00.000Z',
        items: [
          {
            sku: 'CJ-TEST-SKU',
            title: 'Titanium Flask',
            price: 100,
            quantity: 1,
          },
        ],
      },
    ],
    [
      {
        id: 'CJ-TEST-SKU',
        title: 'Titanium Flask',
        description: 'Desc',
        link: 'https://example.com',
        image_link: 'https://example.com/img.jpg',
        price: '100.00 USD',
        wholesale_price: 35,
        shipping_cost: 4.5,
        availability: 'in_stock',
        condition: 'new',
        brand: 'Store',
        google_product_category: 'Home',
        productType: 'dropship',
      } as any,
    ],
    250
  );

  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].orderId, 'ORD-REAL-101');
  assert.equal(ledger[0].retailPrice, 100);
  assert.equal(ledger[0].cjWholesaleCost, 35);
  assert.equal(ledger[0].shippingFee, 4.5);
  assert.equal(ledger[0].netCommission, 60.5);
  assert.equal(ledger[0].status, 'auto_deducted');
});
