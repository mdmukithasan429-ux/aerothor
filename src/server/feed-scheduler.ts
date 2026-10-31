import { buildGmcXmlFeed, GmcProduct, validateGmcProduct } from '../lib/gmc-feed.js';

export interface FeedRefreshLog {
  id: string;
  timestamp: string; // ISO string
  trigger: 'automated_daily' | 'inventory_change' | 'admin_manual' | 'cloud_scheduler';
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
  errorsCount: number;
  warningsCount: number;
  qualityScore: number; // 0-100
  feedSizeBytes: number;
  durationMs: number;
  lastBuildDate: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export interface FeedSchedulerStatus {
  isSchedulerActive: boolean;
  intervalHours: number;
  lastRefreshedAt: string | null;
  nextScheduledRunAt: string;
  nextRunInMs: number;
  cachedFeedSize: number;
  qualityScore: number;
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
  logs: FeedRefreshLog[];
  lastBuildDateRfc822: string;
  feedUrl: string;
}

// In-memory state for feed cache and scheduler
let cachedXmlFeed: string = '';
let lastBuildDateRfc822: string = new Date().toUTCString();
let lastRefreshedAt: string | null = null;
let currentQualityScore: number = 100;
let refreshLogs: FeedRefreshLog[] = [];
let dailyTimer: NodeJS.Timeout | null = null;
let getCatalogCallback: (() => GmcProduct[]) | null = null;

const MAX_LOGS = 50;

/**
 * Calculates milliseconds until next midnight (00:00:00 UTC)
 */
export function getMsUntilNextMidnightUtc(): number {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return Math.max(1000, nextMidnight.getTime() - now.getTime());
}

/**
 * Performs feed compilation, validation, and cache update
 */
export function executeFeedRefresh(
  products: GmcProduct[],
  trigger: FeedRefreshLog['trigger'] = 'automated_daily',
  appUrl: string = 'https://aerothor.vercel.app'
): FeedRefreshLog {
  const startTime = Date.now();
  const now = new Date();
  const rfc822Date = now.toUTCString();

  let totalErrors = 0;
  let totalWarnings = 0;
  let inStock = 0;
  let outOfStock = 0;

  products.forEach((p) => {
    if (p.availability === 'in_stock') inStock++;
    else outOfStock++;

    const issues = validateGmcProduct(p);
    issues.forEach((issue) => {
      if (issue.severity === 'error') totalErrors++;
      else totalWarnings++;
    });
  });

  // Calculate Google Shopping Quality Score
  // Baseline 100, deduction for errors (-15 each) and warnings (-2 each)
  const penalty = (totalErrors * 15) + (totalWarnings * 2);
  const score = Math.max(10, Math.min(100, 100 - penalty));

  // Build compliant XML feed with current lastBuildDate
  const xml = buildGmcXmlFeed(products, {
    title: 'AeroThor Global Store — Official GMC Product Feed',
    link: appUrl || 'https://aerothor.vercel.app',
    description: `High-CRP Direct-to-Consumer Catalog strictly compliant with Google Shopping RSS 2.0 standards. Auto-refreshed: ${rfc822Date}`,
  });

  cachedXmlFeed = xml;
  lastBuildDateRfc822 = rfc822Date;
  lastRefreshedAt = now.toISOString();
  currentQualityScore = score;

  const durationMs = Date.now() - startTime;
  const feedSizeBytes = Buffer.byteLength(xml, 'utf-8');

  const logEntry: FeedRefreshLog = {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    trigger,
    totalProducts: products.length,
    inStockCount: inStock,
    outOfStockCount: outOfStock,
    errorsCount: totalErrors,
    warningsCount: totalWarnings,
    qualityScore: score,
    feedSizeBytes,
    durationMs,
    lastBuildDate: rfc822Date,
    status: totalErrors > 0 ? 'error' : (totalWarnings > 0 ? 'warning' : 'success'),
    message: `Automated refresh completed: ${products.length} products processed (${inStock} in stock, ${outOfStock} out of stock). Quality score: ${score}%.`,
  };

  refreshLogs.unshift(logEntry);
  if (refreshLogs.length > MAX_LOGS) {
    refreshLogs = refreshLogs.slice(0, MAX_LOGS);
  }

  return logEntry;
}

/**
 * Schedules the recurring daily feed refresh at 00:00:00 UTC
 */
function scheduleNextDailyRun(): void {
  if (dailyTimer) {
    clearTimeout(dailyTimer);
    dailyTimer = null;
  }

  const msUntilMidnight = getMsUntilNextMidnightUtc();

  dailyTimer = setTimeout(() => {
    if (getCatalogCallback) {
      const products = getCatalogCallback();
      executeFeedRefresh(products, 'automated_daily');
    }
    // Schedule for the subsequent day
    scheduleNextDailyRun();
  }, msUntilMidnight);
}

/**
 * Initializes the automated daily feed scheduler
 */
export function initDailyFeedScheduler(
  getCatalog: () => GmcProduct[],
  appUrl?: string
): void {
  getCatalogCallback = getCatalog;

  // Perform initial immediate compilation on startup to warm up cache
  const initialProducts = getCatalog();
  executeFeedRefresh(initialProducts, 'automated_daily', appUrl);

  // Arm daily midnight timer
  scheduleNextDailyRun();
}

/**
 * Returns current cached XML feed, generating one if cache is empty
 */
export function getCachedFeed(productsFallback?: GmcProduct[]): { xml: string; lastBuildDate: string; score: number } {
  if (!cachedXmlFeed && productsFallback) {
    executeFeedRefresh(productsFallback, 'automated_daily');
  }
  return {
    xml: cachedXmlFeed,
    lastBuildDate: lastBuildDateRfc822,
    score: currentQualityScore,
  };
}

/**
 * Returns complete feed status, health metrics, and automated run logs
 */
export function getFeedSchedulerStatus(products: GmcProduct[]): FeedSchedulerStatus {
  const msUntilNext = getMsUntilNextMidnightUtc();
  const nextRunDate = new Date(Date.now() + msUntilNext);

  let inStock = 0;
  let outOfStock = 0;
  products.forEach((p) => {
    if (p.availability === 'in_stock') inStock++;
    else outOfStock++;
  });

  return {
    isSchedulerActive: true,
    intervalHours: 24,
    lastRefreshedAt,
    nextScheduledRunAt: nextRunDate.toISOString(),
    nextRunInMs: msUntilNext,
    cachedFeedSize: Buffer.byteLength(cachedXmlFeed || '', 'utf-8'),
    qualityScore: currentQualityScore,
    totalProducts: products.length,
    inStockCount: inStock,
    outOfStockCount: outOfStock,
    logs: refreshLogs,
    lastBuildDateRfc822,
    feedUrl: '/api/feed.xml',
  };
}

/**
 * Stop scheduler (for testing or graceful teardown)
 */
export function stopDailyFeedScheduler(): void {
  if (dailyTimer) {
    clearTimeout(dailyTimer);
    dailyTimer = null;
  }
}
