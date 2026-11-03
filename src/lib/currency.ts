/**
 * Formats a price string (e.g. "49.99 USD") into a display-friendly version (e.g. "$49.99")
 */
export function formatPriceForDisplay(priceString?: string | number | null): string {
  if (priceString === undefined || priceString === null || priceString === '') return '$0.00';
  
  if (typeof priceString === 'number') {
    return Number.isFinite(priceString) ? `$${priceString.toFixed(2)}` : '$0.00';
  }

  const rawStr = String(priceString).trim();
  const match = rawStr.match(/^(\d+(?:\.\d{2})?)\s+([A-Z]{3})$/);
  if (!match) {
    const num = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? rawStr : `$${num.toFixed(2)}`;
  }
  
  const amount = match[1];
  const currency = match[2];
  
  switch (currency) {
    case 'USD':
      return `$${amount}`;
    case 'GBP':
      return `£${amount}`;
    case 'EUR':
      return `€${amount}`;
    case 'CAD':
      return `CA$${amount}`;
    case 'AUD':
      return `A$${amount}`;
    default:
      return `${amount} ${currency}`;
  }
}
