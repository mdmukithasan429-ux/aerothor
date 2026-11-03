import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeXml,
  validateGmcProduct,
  buildGmcXmlFeed,
  GmcProduct,
} from './gmc-feed';

test('escapeXml correctly sanitizes XML sensitive characters', () => {
  const raw = 'Tech & Gadgets <"Smart" Flask> & \'Titanium\'';
  const escaped = escapeXml(raw);
  assert.equal(escaped, 'Tech &amp; Gadgets &lt;&quot;Smart&quot; Flask&gt; &amp; &apos;Titanium&apos;');
});

test('validateGmcProduct flags missing required attributes', () => {
  const invalidProduct: Partial<GmcProduct> = {
    id: '',
    title: '',
    price: 'invalid_price',
  };
  const errors = validateGmcProduct(invalidProduct);
  assert.ok(errors.some((e) => e.field === 'id' && e.severity === 'error'));
  assert.ok(errors.some((e) => e.field === 'title' && e.severity === 'error'));
  assert.ok(errors.some((e) => e.field === 'price' && e.severity === 'error'));
});

test('validateGmcProduct accepts compliant GMC product', () => {
  const validProduct: GmcProduct = {
    id: 'SKU-TITAN-FLASK-01',
    title: 'Titanium Thermal Travel Flask 750ml Vacuum Insulated',
    description: 'Double-walled ultra-lightweight titanium travel flask engineered for USA/UK commuters.',
    link: 'https://example-store.com/products/titanium-flask',
    image_link: 'https://example-store.com/images/flask-main.jpg',
    price: '79.00 USD',
    sale_price: '65.00 USD',
    availability: 'in_stock',
    brand: 'AeroThermal',
    gtin: '012345678905',
    condition: 'new',
    identifier_exists: true,
  };
  const errors = validateGmcProduct(validProduct);
  assert.equal(errors.length, 0);
});

test('buildGmcXmlFeed generates valid RSS 2.0 XML with Google namespace', () => {
  const sampleProducts: GmcProduct[] = [
    {
      id: 'SKU-001',
      title: 'Merino Wool Ergonomic Travel Pillow',
      description: 'Hypoallergenic 100% New Zealand merino wool neck support.',
      link: 'https://store.com/pillow',
      image_link: 'https://store.com/pillow.jpg',
      price: '54.00 GBP',
      availability: 'in_stock',
      brand: 'NordicComfort',
      condition: 'new',
      gtin: '987654321012',
    },
  ];

  const xml = buildGmcXmlFeed(sampleProducts, {
    title: 'Test Store Feed',
    link: 'https://store.com',
    description: 'Test Feed Description',
  });

  assert.ok(xml.includes('xmlns:g="http://base.google.com/ns/1.0"'));
  assert.ok(xml.includes('<g:id>SKU-001</g:id>'));
  assert.ok(xml.includes('<g:price>54.00 GBP</g:price>'));
  assert.ok(xml.includes('<g:condition>new</g:condition>'));
  assert.ok(xml.includes('<![CDATA[Hypoallergenic 100% New Zealand merino wool neck support.]]>'));
});
