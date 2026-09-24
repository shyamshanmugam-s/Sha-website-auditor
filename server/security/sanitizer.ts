import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes untrusted text content to prevent XSS in HTML outputs and PDF templates.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitizes HTML content allowing only safe semantic formatting tags (b, i, em, strong, code, br, p, ul, li).
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'br', 'p', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['class'],
  }).trim();
}

/**
 * Escapes characters for safe string insertion in JSON or plain contexts.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
