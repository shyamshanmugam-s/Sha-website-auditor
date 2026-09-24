"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerEngine = void 0;
const browserPool_js_1 = require("./browserPool.js");
const screenshotManager_js_1 = require("./screenshotManager.js");
const robotsParser_js_1 = require("./robotsParser.js");
const config_js_1 = require("../config.js");
const ssrfGuard_js_1 = require("../security/ssrfGuard.js");
const PRIORITY_KEYWORDS = [
    'about',
    'service',
    'product',
    'contact',
    'project',
    'portfolio',
    'gallery',
    'faq',
    'blog',
    'team',
    'pricing',
    'quote',
    'enquiry',
];
class CrawlerEngine {
    /**
     * Crawls the target website starting from rootUrl.
     */
    static async crawl(rootUrl, auditId, evidenceRegistry, maxPages = config_js_1.CONFIG.MAX_PAGES_DEFAULT, callbacks) {
        const visitedUrls = new Set();
        const urlQueue = [];
        const pageRecords = [];
        // 1. Initial SSRF Check
        const ssrfCheck = await (0, ssrfGuard_js_1.validateUrlForSSRF)(rootUrl);
        if (!ssrfCheck.allowed) {
            throw new Error(`Target URL blocked by security policy: ${ssrfCheck.reason}`);
        }
        const normalizedRoot = ssrfCheck.normalizedUrl || rootUrl;
        const rootParsed = new URL(normalizedRoot);
        const rootHostname = rootParsed.hostname.toLowerCase();
        callbacks?.onProgress?.(5, `Checking robots.txt policy for ${rootHostname}...`);
        const robotsPolicy = await (0, robotsParser_js_1.fetchAndParseRobotsTxt)(normalizedRoot);
        evidenceRegistry.register({
            type: 'robots_check',
            category: 'seo',
            pageUrl: normalizedRoot,
            status: robotsPolicy.allowed ? 'OBSERVED' : 'NOT VERIFIED',
            description: `Robots.txt parsed. Disallowed paths: ${robotsPolicy.disallowedPaths.length}, Sitemaps: ${robotsPolicy.sitemaps.length}`,
            data: {
                disallowedPaths: robotsPolicy.disallowedPaths,
                sitemaps: robotsPolicy.sitemaps,
                crawlDelay: robotsPolicy.crawlDelaySeconds,
            },
        });
        urlQueue.push(normalizedRoot);
        let context = null;
        try {
            context = await browserPool_js_1.BrowserPool.createSecureContext();
            while (urlQueue.length > 0 && visitedUrls.size < maxPages) {
                if (callbacks?.isCancelled?.()) {
                    throw new Error('Audit was cancelled by user');
                }
                const currentUrl = urlQueue.shift();
                const normalizedCurrent = this.normalizeUrl(currentUrl);
                if (visitedUrls.has(normalizedCurrent)) {
                    continue;
                }
                const currentParsed = new URL(normalizedCurrent);
                if ((0, robotsParser_js_1.isPathDisallowed)(currentParsed.pathname, robotsPolicy.disallowedPaths)) {
                    evidenceRegistry.register({
                        type: 'robots_disallow',
                        category: 'technical',
                        pageUrl: normalizedCurrent,
                        status: 'OBSERVED',
                        description: `Skipped crawling ${normalizedCurrent} as specified by robots.txt disallow rule.`,
                    });
                    continue;
                }
                visitedUrls.add(normalizedCurrent);
                const pageNum = visitedUrls.size;
                const progressPercent = Math.min(65, Math.round(10 + (pageNum / maxPages) * 50));
                callbacks?.onProgress?.(progressPercent, `Crawling page ${pageNum}/${Math.min(urlQueue.length + pageNum, maxPages)}: ${normalizedCurrent}`, normalizedCurrent);
                const pageRecord = await this.inspectSinglePage(context, normalizedCurrent, auditId, evidenceRegistry, pageNum === 1 // isHomePage
                );
                pageRecords.push(pageRecord);
                // Discover and prioritize new internal links
                if (visitedUrls.size < maxPages) {
                    const newInternalLinks = pageRecord.internalLinks
                        .map((l) => this.normalizeUrl(l))
                        .filter((l) => {
                        try {
                            const p = new URL(l);
                            return (this.isSameDomain(p.hostname, rootHostname) &&
                                !visitedUrls.has(l) &&
                                !urlQueue.includes(l) &&
                                !this.isAssetOrFile(p.pathname));
                        }
                        catch {
                            return false;
                        }
                    });
                    // Sort internal links by priority keywords
                    newInternalLinks.sort((a, b) => {
                        const aScore = this.getPriorityScore(a);
                        const bScore = this.getPriorityScore(b);
                        return bScore - aScore;
                    });
                    urlQueue.push(...newInternalLinks);
                }
                // Polite delay between page requests
                const delayMs = robotsPolicy.crawlDelaySeconds ? robotsPolicy.crawlDelaySeconds * 1000 : 300;
                await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 1500)));
            }
            return pageRecords;
        }
        finally {
            if (context) {
                await browserPool_js_1.BrowserPool.closeContext(context);
            }
        }
    }
    /**
     * Inspects a single webpage, harvesting DOM, network, console, layout, and visual evidence.
     */
    static async inspectSinglePage(context, targetUrl, auditId, evidenceRegistry, isHomePage) {
        const page = await context.newPage();
        const consoleErrors = [];
        const networkErrors = [];
        const pageEvidenceIds = [];
        // Listen to console errors
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push({
                    text: msg.text(),
                    location: msg.location()?.url,
                });
            }
        });
        // Listen to failed network requests
        page.on('requestfailed', (req) => {
            networkErrors.push({
                url: req.url(),
                status: req.failure()?.errorText || 'Failed',
            });
        });
        page.on('response', (res) => {
            if (res.status() >= 400) {
                networkErrors.push({
                    url: res.url(),
                    status: res.status(),
                    statusText: res.statusText(),
                });
            }
        });
        const startTime = Date.now();
        let response;
        let statusCode = 0;
        let statusText = 'Unknown';
        let contentType = '';
        let finalUrl = targetUrl;
        let securityHeaders = {};
        try {
            response = await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: config_js_1.CONFIG.PAGE_TIMEOUT_MS,
            });
            if (response) {
                statusCode = response.status();
                statusText = response.statusText();
                finalUrl = response.url();
                const headers = response.headers();
                contentType = headers['content-type'] || '';
                securityHeaders = {
                    hsts: headers['strict-transport-security'] || null,
                    csp: headers['content-security-policy'] || null,
                    xFrameOptions: headers['x-frame-options'] || null,
                    xContentTypeOptions: headers['x-content-type-options'] || null,
                    referrerPolicy: headers['referrer-policy'] || null,
                    permissionsPolicy: headers['permissions-policy'] || null,
                };
            }
            // Wait briefly for client-side hydration
            await page.waitForTimeout(600);
        }
        catch (err) {
            statusCode = 0;
            statusText = err.message || 'Page load error';
        }
        const responseTimeMs = Date.now() - startTime;
        // Capture Desktop & Mobile Screenshots for homepage or first 3 pages
        let desktopScreenshotRel;
        let mobileScreenshotRel;
        if (isHomePage || statusCode === 200) {
            try {
                const prefix = isHomePage ? 'homepage' : `page-${Date.now()}`;
                const desk = await screenshotManager_js_1.ScreenshotManager.captureDesktop(page, auditId, `${prefix}-desktop`);
                desktopScreenshotRel = desk.relPath;
                const mob = await screenshotManager_js_1.ScreenshotManager.captureMobile(page, auditId, `${prefix}-mobile`);
                mobileScreenshotRel = mob.relPath;
                const visualEv = evidenceRegistry.register({
                    type: 'visual_screenshot',
                    category: 'visual',
                    pageUrl: targetUrl,
                    status: 'OBSERVED',
                    description: `Captured desktop and mobile viewport screenshots.`,
                    data: {
                        desktopScreenshot: desktopScreenshotRel,
                        mobileScreenshot: mobileScreenshotRel,
                    },
                });
                pageEvidenceIds.push(visualEv.id);
            }
            catch (screenshotErr) {
                // Screenshot capture error
            }
        }
        // Extract detailed DOM, SEO, Form, Contact, and Layout properties
        let domData = {
            title: '',
            metaDescription: '',
            canonicalUrl: '',
            h1s: [],
            headingTree: [],
            internalLinks: [],
            externalLinks: [],
            images: [],
            forms: [],
            contactSignals: { phones: [], emails: [], whatsapps: [] },
            htmlLengthBytes: 0,
        };
        if (statusCode >= 200 && statusCode < 400) {
            try {
                domData = await page.evaluate(() => {
                    const title = document.title || '';
                    const metaDescEl = document.querySelector('meta[name="description"]');
                    const metaDescription = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';
                    const canonicalEl = document.querySelector('link[rel="canonical"]');
                    const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href') || '' : '';
                    // Headings
                    const h1Els = Array.from(document.querySelectorAll('h1'));
                    const h1s = h1Els.map((h) => (h.textContent || '').trim()).filter(Boolean);
                    const headingEls = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                    const headingTree = headingEls.slice(0, 50).map((h) => ({
                        tag: h.tagName.toLowerCase(),
                        text: (h.textContent || '').trim().slice(0, 150),
                    }));
                    // Links
                    const anchorEls = Array.from(document.querySelectorAll('a[href]'));
                    const internalLinks = [];
                    const externalLinks = [];
                    const currentHost = window.location.hostname;
                    const phones = new Set();
                    const emails = new Set();
                    const whatsapps = new Set();
                    anchorEls.forEach((a) => {
                        const href = a.getAttribute('href') || '';
                        if (href.startsWith('tel:')) {
                            phones.add(href.replace('tel:', '').trim());
                        }
                        else if (href.startsWith('mailto:')) {
                            emails.add(href.replace('mailto:', '').split('?')[0].trim());
                        }
                        else if (href.includes('wa.me') || href.includes('whatsapp.com')) {
                            whatsapps.add(href);
                        }
                        else {
                            try {
                                const parsed = new URL(href, window.location.href);
                                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                                    const cleanCurrent = currentHost.toLowerCase().replace(/^www\./, '');
                                    const cleanParsed = parsed.hostname.toLowerCase().replace(/^www\./, '');
                                    if (cleanParsed === cleanCurrent) {
                                        internalLinks.push(parsed.href);
                                    }
                                    else {
                                        externalLinks.push(parsed.href);
                                    }
                                }
                            }
                            catch {
                                // Invalid link
                            }
                        }
                    });
                    // Also scan text for phone/email patterns
                    const bodyText = document.body ? document.body.innerText || '' : '';
                    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                    const foundEmails = bodyText.match(emailRegex) || [];
                    foundEmails.slice(0, 5).forEach((e) => emails.add(e));
                    // Images
                    const imgEls = Array.from(document.querySelectorAll('img'));
                    const images = imgEls.slice(0, 50).map((img) => ({
                        src: img.getAttribute('src') || '',
                        alt: img.getAttribute('alt') || '',
                        naturalWidth: img.naturalWidth || 0,
                        naturalHeight: img.naturalHeight || 0,
                    }));
                    // Forms
                    const formEls = Array.from(document.querySelectorAll('form'));
                    const forms = formEls.map((form) => {
                        const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
                        const hasEmail = inputs.some((i) => i.getAttribute('type') === 'email' || (i.getAttribute('name') || '').toLowerCase().includes('email'));
                        const hasPhone = inputs.some((i) => i.getAttribute('type') === 'tel' || (i.getAttribute('name') || '').toLowerCase().includes('phone'));
                        const hasSubmit = !!form.querySelector('button[type="submit"], input[type="submit"], button:not([type="button"])');
                        return {
                            action: form.getAttribute('action') || '',
                            method: (form.getAttribute('method') || 'GET').toUpperCase(),
                            inputCount: inputs.length,
                            hasEmail,
                            hasPhone,
                            hasSubmit,
                        };
                    });
                    return {
                        title,
                        metaDescription,
                        canonicalUrl,
                        h1s,
                        headingTree,
                        internalLinks: Array.from(new Set(internalLinks)),
                        externalLinks: Array.from(new Set(externalLinks)),
                        images,
                        forms,
                        contactSignals: {
                            phones: Array.from(phones),
                            emails: Array.from(emails),
                            whatsapps: Array.from(whatsapps),
                        },
                        htmlLengthBytes: document.documentElement ? document.documentElement.outerHTML.length : 0,
                    };
                });
            }
            catch (evalErr) {
                // DOM evaluation error
            }
        }
        await page.close();
        // Register atomic evidence records
        const httpEv = evidenceRegistry.register({
            type: 'http_response',
            category: 'technical',
            pageUrl: targetUrl,
            status: statusCode === 200 ? 'TESTED' : statusCode === 0 ? 'NOT VERIFIED' : 'OBSERVED',
            description: `HTTP status ${statusCode} (${statusText}) returned in ${responseTimeMs}ms.`,
            metricValue: responseTimeMs,
            data: { statusCode, statusText, finalUrl, contentType, responseTimeMs },
        });
        pageEvidenceIds.push(httpEv.id);
        if (securityHeaders.hsts || securityHeaders.csp || securityHeaders.xFrameOptions) {
            const secEv = evidenceRegistry.register({
                type: 'security_headers',
                category: 'security',
                pageUrl: targetUrl,
                status: 'OBSERVED',
                description: `Security headers present: ${Object.keys(securityHeaders).filter((k) => !!securityHeaders[k]).join(', ')}`,
                data: securityHeaders,
            });
            pageEvidenceIds.push(secEv.id);
        }
        if (consoleErrors.length > 0) {
            const consoleEv = evidenceRegistry.register({
                type: 'console_errors',
                category: 'technical',
                pageUrl: targetUrl,
                status: 'OBSERVED',
                description: `Detected ${consoleErrors.length} JavaScript console errors.`,
                data: { consoleErrors: consoleErrors.slice(0, 10) },
            });
            pageEvidenceIds.push(consoleEv.id);
        }
        if (networkErrors.length > 0) {
            const netEv = evidenceRegistry.register({
                type: 'network_errors',
                category: 'technical',
                pageUrl: targetUrl,
                status: 'OBSERVED',
                description: `Detected ${networkErrors.length} network request failures.`,
                data: { networkErrors: networkErrors.slice(0, 10) },
            });
            pageEvidenceIds.push(netEv.id);
        }
        return {
            url: targetUrl,
            finalUrl,
            statusCode,
            statusText,
            contentType,
            responseTimeMs,
            title: domData.title,
            metaDescription: domData.metaDescription,
            canonicalUrl: domData.canonicalUrl,
            h1s: domData.h1s,
            headingTree: domData.headingTree,
            desktopScreenshot: desktopScreenshotRel,
            mobileScreenshot: mobileScreenshotRel,
            consoleErrors,
            networkErrors,
            internalLinks: domData.internalLinks,
            externalLinks: domData.externalLinks,
            images: domData.images,
            forms: domData.forms,
            contactSignals: domData.contactSignals,
            securityHeaders: securityHeaders,
            htmlLengthBytes: domData.htmlLengthBytes,
            evidenceIds: pageEvidenceIds,
        };
    }
    static normalizeUrl(urlStr) {
        try {
            const u = new URL(urlStr);
            u.hash = ''; // remove hash fragment
            u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
            if (u.pathname.endsWith('/') && u.pathname.length > 1) {
                u.pathname = u.pathname.slice(0, -1);
            }
            return u.toString();
        }
        catch {
            return urlStr;
        }
    }
    static isAssetOrFile(pathname) {
        const ext = pathname.split('.').pop()?.toLowerCase();
        if (!ext)
            return false;
        const fileExtensions = [
            'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico',
            'pdf', 'zip', 'tar', 'gz', 'mp4', 'webm', 'mp3',
            'css', 'js', 'json', 'xml', 'woff', 'woff2', 'ttf', 'eot',
        ];
        return fileExtensions.includes(ext);
    }
    static getPriorityScore(urlStr) {
        const lower = urlStr.toLowerCase();
        let score = 0;
        for (const kw of PRIORITY_KEYWORDS) {
            if (lower.includes(kw)) {
                score += 10;
            }
        }
        // Prefer shorter path depths
        try {
            const depth = new URL(urlStr).pathname.split('/').filter(Boolean).length;
            score -= depth * 2;
        }
        catch {
            // ignore
        }
        return score;
    }
    static isSameDomain(hostA, hostB) {
        const cleanA = hostA.toLowerCase().replace(/^www\./, '');
        const cleanB = hostB.toLowerCase().replace(/^www\./, '');
        return cleanA === cleanB;
    }
}
exports.CrawlerEngine = CrawlerEngine;
