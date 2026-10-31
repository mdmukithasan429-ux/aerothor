import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProductCsv, validateCsvHeaders } from './csv-importer';

test('validateCsvHeaders detects valid supplier headers with synonyms', () => {
  const validCsv = `Title,SKU,Price,Description,Stock Status,Image URL
Titanium Travel Mug,SKU-TITAN-01,45.00 USD,Double walled,in_stock,https://img.com/1.jpg`;

  const validation = validateCsvHeaders(validCsv);
  assert.equal(validation.isValid, true);
  assert.equal(validation.missingHeaders.length, 0);
  assert.equal(validation.matchedAliases.title, 'title');
  assert.equal(validation.matchedAliases.id, 'sku');
  assert.equal(validation.matchedAliases.price, 'price');
  assert.equal(validation.matchedAliases.availability, 'stock_status');
});

test('validateCsvHeaders flags missing required headers', () => {
  const invalidCsv = `Product Name,Description,Color
Travel Mug,Double walled,Blue`;

  const validation = validateCsvHeaders(invalidCsv);
  assert.equal(validation.isValid, false);
  assert.ok(validation.missingHeaders.includes('id'));
  assert.ok(validation.missingHeaders.includes('price'));
  assert.ok(validation.missingHeaders.includes('availability'));
});

test('parseProductCsv rejects CSV when required headers are missing and halts ingestion', () => {
  const badCsv = `Random Col,Another Col\nValue1,Value2`;
  const result = parseProductCsv(badCsv);
  assert.equal(result.headerValidation.isValid, false);
  assert.equal(result.validProducts.length, 0);
  assert.ok(result.errors.some((e) => e.field === 'headers'));
});

test('parseProductCsv accurately parses dropshipper CSV with custom column names', () => {
  const dropshipCsv = `Title,SKU,Price,Description,Image URL,Availability,GTIN
Wireless Charging Station,SKU-MAG-01,79.00 USD,15W Qi2 Fast Charger,https://img.com/dock.jpg,in_stock,012345678905`;

  const result = parseProductCsv(dropshipCsv);
  assert.equal(result.headerValidation.isValid, true);
  assert.equal(result.validProducts.length, 1);
  assert.equal(result.validProducts[0].id, 'SKU-MAG-01');
  assert.equal(result.validProducts[0].title, 'Wireless Charging Station');
  assert.equal(result.validProducts[0].price, '79.00 USD');
  assert.equal(result.validProducts[0].image_link, 'https://img.com/dock.jpg');
});
