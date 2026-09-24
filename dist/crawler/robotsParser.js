"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndParseRobotsTxt = fetchAndParseRobotsTxt;
exports.isPathDisallowed = isPathDisallowed;
const ssrfGuard_js_1 = require("../security/ssrfGuard.js");
/**
 * Parses and evaluates robots.txt for a website hostname.
 * Respects crawling policy without treating robots.txt as a security barrier.
 */
async function fetchAndParseRobotsTxt(baseUrl) {
    const defaultPolicy = {
        allowed: true,
        sitemaps: [],
        disallowedPaths: [],
    };
    try {
        const parsed = new URL(baseUrl);
        const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
        const ssrfCheck = await (0, ssrfGuard_js_1.validateUrlForSSRF)(robotsUrl);
        if (!ssrfCheck.allowed) {
            return defaultPolicy;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(robotsUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'SHA-Website-Auditor/1.0 (+https://sha-webstudio.com/auditor)',
                'Accept': 'text/plain',
            },
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            return defaultPolicy;
        }
        const text = await response.text();
        const lines = text.split('\n').map((l) => l.trim());
        let isRelevantUserAgent = true;
        const disallowedPaths = [];
        const sitemaps = [];
        let crawlDelay;
        for (const line of lines) {
            if (!line || line.startsWith('#'))
                continue;
            const [rawKey, ...valParts] = line.split(':');
            if (!rawKey || valParts.length === 0)
                continue;
            const key = rawKey.trim().toLowerCase();
            const val = valParts.join(':').trim();
            if (key === 'user-agent') {
                const ua = val.toLowerCase();
                isRelevantUserAgent = ua === '*' || ua.includes('sha-website-auditor');
            }
            else if (key === 'sitemap') {
                if (val.startsWith('http://') || val.startsWith('https://')) {
                    sitemaps.push(val);
                }
            }
            else if (isRelevantUserAgent) {
                if (key === 'disallow') {
                    if (val) {
                        disallowedPaths.push(val);
                    }
                }
                else if (key === 'crawl-delay') {
                    const parsedDelay = parseFloat(val);
                    if (!isNaN(parsedDelay)) {
                        crawlDelay = parsedDelay;
                    }
                }
            }
        }
        return {
            allowed: true,
            crawlDelaySeconds: crawlDelay,
            sitemaps,
            disallowedPaths,
        };
    }
    catch {
        return defaultPolicy;
    }
}
/**
 * Checks if a specific path is disallowed according to robots rules.
 */
function isPathDisallowed(pathname, disallowedPaths) {
    for (const path of disallowedPaths) {
        if (path === '/')
            return true;
        if (path && pathname.startsWith(path)) {
            return true;
        }
    }
    return false;
}
