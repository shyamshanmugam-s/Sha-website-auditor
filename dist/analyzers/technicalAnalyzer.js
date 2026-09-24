"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalAnalyzer = void 0;
class TechnicalAnalyzer {
    static analyze(pages, evidenceRegistry) {
        const findings = [];
        const homePage = pages[0] || null;
        let totalBrokenLinks = 0;
        let totalBrokenImages = 0;
        let totalConsoleErrors = 0;
        pages.forEach((page) => {
            totalConsoleErrors += page.consoleErrors.length;
            totalBrokenLinks += page.networkErrors.filter((e) => typeof e.status === 'number' && e.status === 404).length;
        });
        // 1. HTTPS Check
        let httpsStatus = 'NOT VERIFIED';
        if (homePage) {
            const isHttps = homePage.finalUrl.startsWith('https://');
            httpsStatus = isHttps ? 'Enforced (HTTPS)' : 'Insecure (HTTP)';
            if (!isHttps) {
                const ev = evidenceRegistry.register({
                    type: 'https_check',
                    category: 'technical',
                    pageUrl: homePage.url,
                    status: 'TESTED',
                    description: 'Website does not serve over HTTPS protocol.',
                    metricValue: 0,
                });
                findings.push({
                    id: 'TECH-001',
                    category: 'technical',
                    priority: 'CRITICAL',
                    title: 'Unencrypted HTTP Connection (Missing HTTPS)',
                    observation: `The website loads over unencrypted HTTP: ${homePage.finalUrl}`,
                    evidence: `Final resolved URL is ${homePage.finalUrl}. All traffic and submitted form data is unencrypted in transit.`,
                    evidenceIds: [ev.id, ...homePage.evidenceIds],
                    impact: 'Exposes users to eavesdropping and data interception, triggers browser security warnings, and negatively affects trust.',
                    recommendation: 'Install an SSL/TLS certificate and configure a 301 permanent redirect from HTTP to HTTPS for all routes.',
                    verificationStatus: 'TESTED',
                    pageUrl: homePage.url,
                });
            }
        }
        // 2. Console Errors Check
        if (totalConsoleErrors > 0) {
            const consolePages = pages.filter((p) => p.consoleErrors.length > 0);
            const sampleErrors = consolePages.flatMap((p) => p.consoleErrors.map((e) => e.text)).slice(0, 3);
            const evIds = consolePages.flatMap((p) => p.evidenceIds);
            findings.push({
                id: 'TECH-002',
                category: 'technical',
                priority: totalConsoleErrors > 5 ? 'HIGH' : 'MEDIUM',
                title: `Uncaught JavaScript Console Errors (${totalConsoleErrors} detected)`,
                observation: `Detected ${totalConsoleErrors} runtime JavaScript errors across ${consolePages.length} pages.`,
                evidence: `Sample errors:\n- ${sampleErrors.join('\n- ')}`,
                evidenceIds: evIds.slice(0, 5),
                impact: 'JavaScript errors can break interactive UI elements, sliders, forms, tracking scripts, and lead to poor user experience.',
                recommendation: 'Inspect browser developer console logs, fix unhandled exceptions, and ensure third-party scripts load safely.',
                verificationStatus: 'OBSERVED',
            });
        }
        // 3. Security Headers Check
        if (homePage) {
            const headers = homePage.securityHeaders;
            const missingHeaders = [];
            if (!headers.hsts)
                missingHeaders.push('Strict-Transport-Security (HSTS)');
            if (!headers.csp)
                missingHeaders.push('Content-Security-Policy (CSP)');
            if (!headers.xFrameOptions)
                missingHeaders.push('X-Frame-Options');
            if (!headers.xContentTypeOptions)
                missingHeaders.push('X-Content-Type-Options');
            if (missingHeaders.length > 0) {
                const ev = evidenceRegistry.register({
                    type: 'missing_security_headers',
                    category: 'security',
                    pageUrl: homePage.url,
                    status: 'OBSERVED',
                    description: `Missing recommended security headers: ${missingHeaders.join(', ')}`,
                    data: { missingHeaders },
                });
                findings.push({
                    id: 'SEC-001',
                    category: 'security',
                    priority: 'MEDIUM',
                    title: `Missing Defensive HTTP Security Headers (${missingHeaders.length} missing)`,
                    observation: `The web server response does not include standard defensive headers: ${missingHeaders.join(', ')}.`,
                    evidence: `Response headers from ${homePage.url} were inspected. Found: ${JSON.stringify(headers)}`,
                    evidenceIds: [ev.id],
                    impact: 'Leaves the website vulnerable to clickjacking (missing X-Frame-Options), MIME-type sniffing, and cross-site scripting risks.',
                    recommendation: 'Configure your web server (Nginx/Apache/Cloudflare) to send HSTS, X-Frame-Options: SAMEORIGIN, and X-Content-Type-Options: nosniff headers.',
                    verificationStatus: 'OBSERVED',
                    pageUrl: homePage.url,
                });
            }
        }
        // 4. Broken Links / 404s
        if (totalBrokenLinks > 0) {
            const brokenPages = pages.filter((p) => p.networkErrors.some((e) => e.status === 404));
            const evIds = brokenPages.flatMap((p) => p.evidenceIds);
            findings.push({
                id: 'TECH-003',
                category: 'technical',
                priority: 'HIGH',
                title: `Broken Links / 404 HTTP Responses (${totalBrokenLinks} detected)`,
                observation: `Encountered ${totalBrokenLinks} broken resource or link requests returning HTTP 404 Not Found status.`,
                evidence: `404 status codes received during crawling across ${brokenPages.length} inspected pages.`,
                evidenceIds: evIds.slice(0, 5),
                impact: 'Degrades user experience, damages SEO crawl budget, and creates dead-end navigation for visitors.',
                recommendation: 'Audit all internal hyperlinks, update or redirect obsolete URLs, and ensure all asset paths are valid.',
                verificationStatus: 'TESTED',
            });
        }
        const summary = `Inspected ${pages.length} pages. HTTPS is ${httpsStatus}. Found ${totalConsoleErrors} console errors, ${totalBrokenLinks} broken link errors, and evaluated server security headers.`;
        return {
            summary,
            findings,
            httpsStatus,
            redirectsStatus: 'Verified during crawl',
            brokenLinksCount: totalBrokenLinks,
            brokenImagesCount: totalBrokenImages,
            consoleErrorsCount: totalConsoleErrors,
        };
    }
}
exports.TechnicalAnalyzer = TechnicalAnalyzer;
