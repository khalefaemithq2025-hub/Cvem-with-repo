/**
 * imageUtils.ts — v2.6.5
 *
 * Centralised image helpers for CyberVolt e-Mall.
 *
 * PROBLEM FIXED:
 * Product images were disappearing because:
 *  1. External URLs (picsum, loremflickr, etc.) are rate-limited / blocked by
 *     some networks and return 4xx/5xx, leaving <img> with no src.
 *  2. No onError handler was present to swap in a safe fallback.
 *
 * SOLUTION:
 *  - `getProductImageUrl(url)` sanitises and validates the src before use.
 *  - `onProductImageError(e)` is an onError handler to attach to every <img>
 *    that shows a product photo — it replaces broken images with a local SVG
 *    placeholder that never fails.
 *  - `PRODUCT_IMAGE_FALLBACK` is the inline SVG data-URI used as the fallback.
 */

// ── Inline SVG fallback (data-URI — zero network requests, never fails) ───────
export const PRODUCT_IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' " +
  "viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%230d1a2e'/%3E" +
  "%3Crect x='150' y='90' width='100' height='80' rx='8' fill='none' stroke='%2300b0ff' stroke-width='2'/%3E" +
  "%3Cline x1='150' y1='90' x2='250' y2='170' stroke='%2300b0ff' stroke-width='1.5'/%3E" +
  "%3Cline x1='250' y1='90' x2='150' y2='170' stroke='%2300b0ff' stroke-width='1.5'/%3E" +
  "%3Ccircle cx='200' cy='210' r='12' fill='none' stroke='%2300b0ff' stroke-width='2'/%3E" +
  "%3Ctext x='200' y='250' text-anchor='middle' font-family='sans-serif' " +
  "font-size='12' fill='%2367e8f9'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E";

/**
 * Returns a clean image src string.
 * - Passes through valid http/https URLs and data-URIs unchanged.
 * - Returns the fallback for empty, relative, or clearly broken values.
 */
export function getProductImageUrl(src?: string | null): string {
  if (!src) return PRODUCT_IMAGE_FALLBACK;
  const trimmed = src.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  // relative paths are fine in a bundled app
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) return trimmed;
  return PRODUCT_IMAGE_FALLBACK;
}

/**
 * Drop-in onError handler for product <img> elements.
 *
 * Usage:
 *   <img src={product.image} onError={onProductImageError} alt={product.name} />
 *
 * Prevents infinite error loops by removing itself after the first failure.
 */
export function onProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
): void {
  const img = e.currentTarget;
  // Remove the handler first to prevent infinite loop if fallback itself fails
  img.onerror = null;
  img.src = PRODUCT_IMAGE_FALLBACK;
}

/**
 * Returns a style object for a product image container that uses the
 * fallback as a CSS background — useful for div-based image cards.
 *
 * Usage:
 *   <div style={productImageContainerStyle(product.image)} />
 */
export function productImageContainerStyle(
  src?: string | null,
): React.CSSProperties {
  const url = getProductImageUrl(src);
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    // Show fallback colour until image loads
    backgroundColor: '#0d1a2e',
  };
}
