"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeText = sanitizeText;
exports.sanitizeRichText = sanitizeRichText;
exports.escapeHtml = escapeHtml;
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
/**
 * Sanitizes untrusted text content to prevent XSS in HTML outputs and PDF templates.
 */
function sanitizeText(text) {
    if (!text)
        return '';
    return isomorphic_dompurify_1.default.sanitize(text, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [],
    }).trim();
}
/**
 * Sanitizes HTML content allowing only safe semantic formatting tags (b, i, em, strong, code, br, p, ul, li).
 */
function sanitizeRichText(html) {
    if (!html)
        return '';
    return isomorphic_dompurify_1.default.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'br', 'p', 'ul', 'ol', 'li', 'span'],
        ALLOWED_ATTR: ['class'],
    }).trim();
}
/**
 * Escapes characters for safe string insertion in JSON or plain contexts.
 */
function escapeHtml(str) {
    if (!str)
        return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
