# AeroThor — Global Hybrid E-Commerce, Dropshipping & 10-Region Affiliate Engine

**AeroThor** (`https://aerothor.vercel.app`) is a full-stack hybrid e-commerce platform, automated dropshipping storefront, and programmatic international SEO engine built with **React 19**, **TypeScript**, **Vite**, **Express SSR**, **Supabase PostgreSQL**, **Stripe Checkout**, **CJdropshipping API v2.0**, and **Amazon Associates (10 Target Markets)**.

---

## Key Capabilities

### 1. Hybrid Commerce & Fulfillment Architecture
- **Direct Dropshipping & Native Checkout**: Full cart, multi-currency conversion, and dynamic **Stripe Checkout** + **Cash on Delivery (COD)** flows backed by live database configuration.
- **Automated CJdropshipping v2.0 Integration**: Real-time product sourcing, cost/margin synchronization, stock validation, and automated order fulfillment (`api/cj.ts`).
- **10-Region Amazon Associates Engine**: High-converting external affiliate routing (`#FF9900` CTA flows, verified ASIN/Link injection, automatic `tag=` parameter preservation, and multi-region storefront localization).

### 2. International SEO (i18n), Edge Geo-Routing & CRO
- **Edge Geo-Detection Middleware (`middleware.ts`)**:
  - Zero-dependency Web-standard Edge Middleware reading Vercel's `x-vercel-ip-country` header (with query override `?region=` / `?country=`).
  - Automatically rewrites `/deals` requests from supported countries to their localized `/deals/[country]` landing page.
  - Sets client-readable geo cookies (`aero_geo_country`, `aero_geo_slug`, `aero_geo_banner`) and response headers (`x-geo-dispatch-banner`) to personalize the top notification bar (`"Free 48h Dispatch to [User's Country]"`).
- **10 Active Target Regions**:
  - **United States** (`/deals/us` — `en-US`, `USD`, `amazon.com`)
  - **United Kingdom** (`/deals/uk` — `en-GB`, `GBP`, `amazon.co.uk`)
  - **Canada** (`/deals/canada` — `en-CA`, `CAD`, `amazon.ca`)
  - **France** (`/deals/france` — `fr-FR`, `EUR`, `amazon.fr`)
  - **Germany** (`/deals/germany` — `de-DE`, `EUR`, `amazon.de`)
  - **Italy** (`/deals/italy` — `it-IT`, `EUR`, `amazon.it`)
  - **Netherlands** (`/deals/netherlands` — `nl-NL`, `EUR`, `amazon.nl`)
  - **Poland** (`/deals/poland` — `pl-PL`, `PLN`, `amazon.pl`)
  - **Spain** (`/deals/spain` — `es-ES`, `EUR`, `amazon.es`)
  - **Sweden** (`/deals/sweden` — `sv-SE`, `SEK`, `amazon.se`)
- **Server-Side Dynamic Metadata & Rich Snippets**:
  - Full HTML `<head>` injection for `/product/:id` and `/deals/:country` with canonical URLs, 11 `hreflang` alternate links (`10 regions + x-default`), OpenGraph, Twitter Cards, and Schema.org `Product`, `Offer`, `AggregateRating`, `ItemList`, and `BreadcrumbList` JSON-LD.
  - Dynamic `/sitemap.xml`, `/robots.txt`, and Google Merchant Center RSS 2.0 XML product feed (`/feed.xml`).
- **Conversion Rate Optimization (CRO)**:
  - Dynamic Flash Sale countdown timers, low-stock scarcity triggers, trust badges (`Secure Stripe Checkout`, `30-Day Money-Back Guarantee`), and cross-sell `Related Deals` carousels.

### 3. Enterprise ERP Admin Dashboard
- **Paginated Product Inventory & CSV Bulk Import**:
  - Server- and client-paginated inventory management (`10`, `15`, `25`, `50` items/page) with instant filtering by category and fulfillment model (`Dropshipping` vs `Affiliate`).
  - Interactive **Import CSV** modal with downloadable template and bulk ingestion API (`/api/admin/products/import`).
- **Live Order Status Controls**:
  - Real-time `<select>` status dropdown (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) wired to `PATCH /api/admin/orders/:id/status` with optimistic spinner states and toast notifications.
- **Dynamic Store Settings (`StoreSettings`)**:
  - Live toggle switches for **Stripe** and **Cash on Delivery (COD)**, runtime **CJdropshipping API Token** management, default store currency, and support/return email configuration via `/api/admin/settings`.

---

## Project Structure

```text
├── api/
│   ├── index.ts                 # Vercel Serverless Express entry point (SSR SEO, API routes, feeds)
│   └── cj.ts                    # CJdropshipping API v2.0 client & fulfillment integration
├── app/                         # Next.js App Router reference modules (SEO, Sitemap, Admin, Deals)
│   ├── admin/
│   │   ├── inventory/page.tsx   # Paginated Product Inventory & CSV Import UI
│   │   └── settings/page.tsx    # Global Store Settings & Payment Gateway Admin UI
│   ├── api/                     # Modular route handlers (Orders, Settings, Checkout)
│   ├── deals/[country]/page.tsx # Programmatic 10-country landing page template
│   ├── product/[id]/page.tsx    # Dynamic Product SSR metadata, hreflang & JSON-LD
│   ├── layout.tsx               # Global international metadata & hreflang matrix
│   ├── robots.ts                # Search engine crawler configuration
│   └── sitemap.ts               # Dynamic XML sitemap generator (products + 10 regions)
├── lib/
│   └── i18n-regions.ts          # Single source of truth for the 10 target countries & currencies
├── prisma/
│   └── schema.prisma            # PostgreSQL schema (Product, Order, StoreSettings)
├── src/
│   ├── components/              # React 19 UI components (ProductModal, AdminDashboard, TopBar, etc.)
│   ├── context/                 # Global state, currency conversion & live settings sync
│   └── App.tsx                  # Main SPA & regional landing page router
├── middleware.ts                # Root Vercel Edge Middleware (Web-standard Request/Response)
├── server.ts                    # Full-stack Express + Vite server (port 3000)
└── vercel.json                  # Vercel routing, SSR rewrites & Edge configuration
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for privileged backend operations |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `CJ_API_KEY` | CJdropshipping API v2.0 key (can also be managed from Admin Settings) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for Admin ERP portal authentication |
| `JWT_SECRET` | Secret key for signing admin session tokens |

---

## Local Development & Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server (Port 3000)
```bash
npm run dev
```

### 3. Type-Check & Build for Production
```bash
npm run lint
npm run build
```

### 4. Verify Geo-Routing & SEO Endpoints
- **Regional Landing Pages**: `/deals/uk`, `/deals/us`, `/deals/canada`, `/deals/germany`, `/deals/france`, `/deals/italy`, `/deals/netherlands`, `/deals/poland`, `/deals/spain`, `/deals/sweden`
- **Geo-Detection Diagnostics**: `/api/seo/geo-check?region=uk`
- **Dynamic Sitemap**: `/sitemap.xml`
- **Google Merchant Feed**: `/feed.xml`
