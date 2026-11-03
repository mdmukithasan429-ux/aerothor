import React, { useState } from 'react';
import { Share2, Check, Copy, ExternalLink } from 'lucide-react';

export const LIVE_STORE_DOMAIN = 'https://aerothor.vercel.app';

export interface SocialShareProps {
  productId: string;
  productTitle: string;
  imageUrl?: string;
  productUrl?: string;
  variant?: 'full' | 'compact' | 'card';
  className?: string;
}

/**
 * Ensures product_url always resolves to the absolute live domain URL:
 * https://aerothor.vercel.app/product/{id}
 */
export function resolveAbsoluteProductUrl(productId: string, customUrl?: string): string {
  const cleanId = encodeURIComponent(String(productId || '').trim());
  if (customUrl && customUrl.trim()) {
    const trimmed = customUrl.trim();
    if (trimmed.startsWith('https://aerothor.vercel.app/')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return `${LIVE_STORE_DOMAIN}${trimmed}`;
    }
  }
  return `${LIVE_STORE_DOMAIN}/product/${cleanId}`;
}

/**
 * Ensures image_url resolves to an absolute HTTPS URL for Pinterest media parameter
 */
export function resolveAbsoluteImageUrl(imageUrl?: string): string {
  const fallback =
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
  if (!imageUrl || !imageUrl.trim()) return fallback;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }
  if (trimmed.startsWith('/')) {
    return `${LIVE_STORE_DOMAIN}${trimmed}`;
  }
  return fallback;
}

/**
 * Builds the exact Pinterest Smart Share Intent URL:
 * https://pinterest.com/pin/create/button/?url={product_url}&media={image_url}&description={product_title}
 */
export function buildPinterestShareUrl(params: {
  productId: string;
  productTitle: string;
  imageUrl?: string;
  productUrl?: string;
}): string {
  const resolvedUrl = resolveAbsoluteProductUrl(params.productId, params.productUrl);
  const resolvedMedia = resolveAbsoluteImageUrl(params.imageUrl);
  const resolvedTitle = String(params.productTitle || 'AeroThor Verified Deal').trim();

  return `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
    resolvedUrl
  )}&media=${encodeURIComponent(resolvedMedia)}&description=${encodeURIComponent(resolvedTitle)}`;
}

/**
 * Builds the exact Reddit Smart Share Intent URL:
 * https://www.reddit.com/submit?url={product_url}&title={product_title}
 */
export function buildRedditShareUrl(params: {
  productId: string;
  productTitle: string;
  productUrl?: string;
}): string {
  const resolvedUrl = resolveAbsoluteProductUrl(params.productId, params.productUrl);
  const resolvedTitle = String(params.productTitle || 'AeroThor Verified Deal').trim();

  return `https://www.reddit.com/submit?url=${encodeURIComponent(
    resolvedUrl
  )}&title=${encodeURIComponent(resolvedTitle)}`;
}

/**
 * Crisp Branded SVG Icons for Pinterest & Reddit
 */
export const PinterestIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z" />
  </svg>
);

export const RedditIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

export const SocialShare: React.FC<SocialShareProps> = ({
  productId,
  productTitle,
  imageUrl,
  productUrl,
  variant = 'full',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const absoluteProductUrl = resolveAbsoluteProductUrl(productId, productUrl);
  const pinterestHref = buildPinterestShareUrl({
    productId,
    productTitle,
    imageUrl,
    productUrl: absoluteProductUrl,
  });
  const redditHref = buildRedditShareUrl({
    productId,
    productTitle,
    productUrl: absoluteProductUrl,
  });

  const handleCopyLiveUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(absoluteProductUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. COMPACT VARIANT: Small, sleek Pinterest & Reddit icon buttons for Admin Inventory rows
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={pinterestHref}
          target="_blank"
          rel="noopener noreferrer"
          title={`Pin "${productTitle}" on Pinterest (${absoluteProductUrl})`}
          aria-label={`Pin ${productTitle} on Pinterest`}
          className="p-1.5 rounded-lg bg-[#E60023]/15 hover:bg-[#E60023] text-[#ff4d67] hover:text-white border border-[#E60023]/30 transition-all cursor-pointer flex items-center justify-center shadow-sm"
        >
          <PinterestIcon className="w-3.5 h-3.5" />
        </a>

        <a
          href={redditHref}
          target="_blank"
          rel="noopener noreferrer"
          title={`Submit "${productTitle}" to Reddit (${absoluteProductUrl})`}
          aria-label={`Share ${productTitle} on Reddit`}
          className="p-1.5 rounded-lg bg-[#FF4500]/15 hover:bg-[#FF4500] text-[#ff6a33] hover:text-white border border-[#FF4500]/30 transition-all cursor-pointer flex items-center justify-center shadow-sm"
        >
          <RedditIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 2. CARD VARIANT: Sleek "Share this Deal" bar for Public Storefront product cards
  if (variant === 'card') {
    return (
      <div
        className={`pt-2.5 mt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Share2 className="w-3 h-3 text-emerald-400" />
          <span>Share this Deal</span>
        </span>

        <div className="flex items-center gap-1.5">
          <a
            href={pinterestHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Pin on Pinterest: ${absoluteProductUrl}`}
            className="px-2 py-1 rounded-md bg-[#E60023]/15 hover:bg-[#E60023] text-[#ff4d67] hover:text-white border border-[#E60023]/30 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
          >
            <PinterestIcon className="w-3 h-3" />
            <span>Pin</span>
          </a>

          <a
            href={redditHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on Reddit: ${absoluteProductUrl}`}
            className="px-2 py-1 rounded-md bg-[#FF4500]/15 hover:bg-[#FF4500] text-[#ff6a33] hover:text-white border border-[#FF4500]/30 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
          >
            <RedditIcon className="w-3 h-3" />
            <span>Reddit</span>
          </a>
        </div>
      </div>
    );
  }

  // 3. FULL VARIANT: Prominent "Share this Deal" section below "Buy on Amazon / Add to Cart" buttons on Public Product Page
  return (
    <div
      className={`p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Share this Deal</span>
          <span className="text-[10px] font-mono font-normal text-slate-400 normal-case">
            · US &amp; UK Viral Traffic Links
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyLiveUrl}
          title={absoluteProductUrl}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied Live URL</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy URL</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <a
          href={pinterestHref}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-4 rounded-xl bg-[#E60023] hover:bg-[#ad081b] active:bg-[#8c0615] text-white font-extrabold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-[#E60023]/20 cursor-pointer"
        >
          <PinterestIcon className="w-4 h-4 shrink-0" />
          <span>Pin on Pinterest</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>

        <a
          href={redditHref}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-4 rounded-xl bg-[#FF4500] hover:bg-[#e03d00] active:bg-[#c23400] text-white font-extrabold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-[#FF4500]/20 cursor-pointer"
        >
          <RedditIcon className="w-4 h-4 shrink-0" />
          <span>Share on Reddit</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      </div>

      <div className="text-[10px] font-mono text-slate-400 truncate">
        Target URL: <span className="text-slate-300 select-all">{absoluteProductUrl}</span>
      </div>
    </div>
  );
};

export default SocialShare;
