import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-0KS0T13HQ7';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      'https://e-commerce-dropshiping-store.vercel.app'
  ),
  title: 'AeroThor — Minimalist Performance Essentials for High-Velocity Commuters',
  description:
    'Grade 1 titanium vessels, 100% pure merino thermal wear, and Qi2 aerospace charging hardware. Direct US & UK domestic warehouse dispatch within 3-7 business days.',
  verification: {
    google: ['googlee6a39edbc64fe5aa', 'XYvXZ1Kd3MsTbTSeQRzyddv22J163MNCsdavsGaW4iE'],
  },
  openGraph: {
    title: 'AeroThor — Minimalist Performance Essentials',
    description:
      'Direct US & UK domestic warehouse dispatch with real-time tracking and 30-day free returns.',
    url: 'https://e-commerce-dropshiping-store.vercel.app',
    siteName: 'AeroThor Official Store',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'AeroThor Performance Essentials',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AeroThor — Minimalist Performance Essentials',
    description:
      'Direct US & UK domestic warehouse dispatch with real-time tracking and 30-day free returns.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Merchant Center & Search Console Domain Ownership Verification Meta */}
        <meta
          name="google-site-verification"
          content="googlee6a39edbc64fe5aa"
        />
        <meta
          name="google-site-verification"
          content="googlee6a39edbc64fe5aa.html"
        />
        <meta
          name="google-site-verification"
          content="XYvXZ1Kd3MsTbTSeQRzyddv22J163MNCsdavsGaW4iE"
        />

        {/* Google Analytics 4 (GA4) for Google Merchant Center Verification */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              cookie_flags: 'SameSite=None;Secure'
            });
          `}
        </Script>
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
