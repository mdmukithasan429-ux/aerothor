# AeroThor — Full-Stack Next.js SaaS & Headless E-Commerce Platform

**Live Production URL:** [https://aerothor.smmgrows.com](https://aerothor.smmgrows.com)

AeroThor is an enterprise-grade, white-label **Full-Stack Next.js (App Router) B2B SaaS & Headless E-Commerce Platform** engineered for high-converting direct-to-consumer (DTC) commerce, automated dropshipping fulfillment, and multi-network affiliate monetization across the **United States (`en-US`)** and **United Kingdom (`en-GB`)**.

---

## Key Features & Architecture

### 1. Full-Stack Next.js & Headless Commerce Engine
- **Dynamic Server Rendering (`force-dynamic`)**: Real-time inventory, order ledgers, and administrative telemetry powered by Next.js App Router, React 19, and Prisma ORM (PostgreSQL / Supabase).
- **1,060+ Verified SKU Catalog**: Deduplicated catalog featuring precision 3M protective device skins, everyday carry (EDC) essentials, and trending US/UK tech accessories.
- **Google Merchant Center (GMC) RSS 2.0 Feed**: Automated XML shopping feed (`/api/feed.xml`) with strict GTIN/MPN validation, regional shipping rules, and automatic price/stock synchronization.

### 2. Stripe Payments (Test Mode & Live Production Ready)
- **Seamless Stripe Checkout Integration**: Full support for **Stripe Test Mode** and Live Mode checkout sessions, dynamic currency formatting (`USD` / `GBP`), and automated webhook reconciliation (`/api/webhooks/stripe`).
- **Real-Time Commission & Deduction Ledger**: Tracks gross order value, Stripe processing fees (`2.9% + $0.30`), supplier COGS, and net profit margins in real time.

### 3. Google Analytics 4 (GA4) & Real-Time Traffic Telemetry
- **Client & Server GA4 Integration**: Built-in `gtag.js` event instrumentation alongside server-side `@google-analytics/data` (`BetaAnalyticsDataClient`) integration.
- **International SEO & Traffic Dashboard**: Live 14-day US vs. UK visitor split, active user telemetry, and outbound affiliate click tracking with zero mock or synthetic numbers.

### 4. White-Label B2B SaaS Theme & Settings Engine
- **Singleton `StoreSettings` Architecture**: Configure store name, support email, phone number, physical warehouse address, logo URL, and primary brand hex color (`primaryColorHex`) directly from the **Admin ERP > Settings > General** panel without touching code.
- **Dynamic CSS Variables**: Instant storefront re-theming driven by database-persisted brand colors and metadata.

### 5. Technical SEO for US & UK Markets
- **Dynamic Sitemap & Robots (`app/sitemap.ts` & `app/robots.ts`)**: Automatic indexing of all verified products and regional deal hubs (`/deals/us`, `/deals/uk`).
- **Strict `hreflang` Geo-Targeting**: Configured for `en-US`, `en-GB`, and `x-default` to maximize US/UK organic rankings and filter out non-target regional traffic.

---

## Environment Variables (`.env`)

Copy `.env.example` to `.env.local` (or add to Vercel Project Settings):

```env
# Canonical Domain
NEXT_PUBLIC_SITE_URL="https://aerothor.smmgrows.com"
APP_URL="https://aerothor.smmgrows.com"
DEFAULT_CURRENCY="USD"

# PostgreSQL / Supabase (Prisma)
DATABASE_URL="postgresql://postgres:password@db.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Stripe Checkout (Supports Test Mode or Live Mode keys)
STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"
STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET"

# Google Analytics 4 (Client & Data API)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-0KS0T13HQ7"
GA4_PROPERTY_ID="YOUR_NUMERIC_GA4_PROPERTY_ID"
GA4_CLIENT_EMAIL="aerothor-ga4-reader@your-gcp-project.iam.gserviceaccount.com"
GA4_PRIVATE_KEY="YOUR_GCP_SERVICE_ACCOUNT_PRIVATE_KEY"

# Affiliate & Dropshipping Integrations
NEXT_PUBLIC_AMAZON_TAG_US="yourustag-20"
NEXT_PUBLIC_AMAZON_TAG_UK="youruktag-21"
CJ_API_KEY="YOUR_CJ_API_KEY"
ADMIN_PASSWORD="YOUR_ADMIN_SECURE_PASSWORD"
```

---

## Local Development & Deployment

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Build for production
npm run build
```
