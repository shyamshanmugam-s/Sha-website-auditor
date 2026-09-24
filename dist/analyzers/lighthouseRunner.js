"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LighthouseRunner = void 0;
const lighthouse_1 = __importDefault(require("lighthouse"));
const chromeLauncher = __importStar(require("chrome-launcher"));
class LighthouseRunner {
    /**
     * Runs Lighthouse on the given URL to measure official Core Web Vitals, Performance, Accessibility, Best Practices, and SEO.
     */
    static async run(targetUrl, evidenceRegistry) {
        let chrome = null;
        try {
            // Launch chrome for lighthouse
            chrome = await chromeLauncher.launch({
                chromeFlags: [
                    '--headless',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                ],
            });
            const options = {
                logLevel: 'error',
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
                port: chrome.port,
            };
            const runnerResult = await (0, lighthouse_1.default)(targetUrl, options);
            if (!runnerResult || !runnerResult.lhr) {
                throw new Error('Lighthouse returned empty report');
            }
            const lhr = runnerResult.lhr;
            const categories = lhr.categories || {};
            const audits = lhr.audits || {};
            const performanceScore = categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null;
            const accessibilityScore = categories.accessibility?.score != null ? Math.round(categories.accessibility.score * 100) : null;
            const bestPracticesScore = categories['best-practices']?.score != null ? Math.round(categories['best-practices'].score * 100) : null;
            const seoScore = categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null;
            // Extract Core Web Vitals
            const fcpMs = audits['first-contentful-paint']?.numericValue != null ? Math.round(audits['first-contentful-paint'].numericValue) : null;
            const lcpMs = audits['largest-contentful-paint']?.numericValue != null ? Math.round(audits['largest-contentful-paint'].numericValue) : null;
            const cls = audits['cumulative-layout-shift']?.numericValue != null ? Number(audits['cumulative-layout-shift'].numericValue.toFixed(3)) : null;
            const tbtMs = audits['total-blocking-time']?.numericValue != null ? Math.round(audits['total-blocking-time'].numericValue) : null;
            const speedIndexMs = audits['speed-index']?.numericValue != null ? Math.round(audits['speed-index'].numericValue) : null;
            const interactiveMs = audits['interactive']?.numericValue != null ? Math.round(audits['interactive'].numericValue) : null;
            // Register atomic evidence
            const ev = evidenceRegistry.register({
                type: 'lighthouse_report',
                category: 'performance',
                pageUrl: targetUrl,
                status: 'TESTED',
                description: `Lighthouse run: Perf ${performanceScore ?? 'N/A'}, A11y ${accessibilityScore ?? 'N/A'}, SEO ${seoScore ?? 'N/A'}, BestPractices ${bestPracticesScore ?? 'N/A'}`,
                metricValue: performanceScore,
                data: {
                    performanceScore,
                    accessibilityScore,
                    bestPracticesScore,
                    seoScore,
                    fcpMs,
                    lcpMs,
                    cls,
                    tbtMs,
                    speedIndexMs,
                },
            });
            const auditItems = Object.entries(audits)
                .filter(([_, a]) => a.score !== null && a.score < 1)
                .slice(0, 20)
                .map(([id, a]) => ({
                id,
                title: a.title || id,
                description: a.description || '',
                score: a.score,
                displayValue: a.displayValue,
            }));
            return {
                performanceScore,
                accessibilityScore,
                bestPracticesScore,
                seoScore,
                metrics: {
                    firstContentfulPaintMs: fcpMs,
                    largestContentfulPaintMs: lcpMs,
                    cumulativeLayoutShift: cls,
                    totalBlockingTimeMs: tbtMs,
                    speedIndexMs: speedIndexMs,
                    interactiveMs: interactiveMs,
                },
                audits: auditItems,
                status: 'TESTED',
            };
        }
        catch (err) {
            // Graceful fallback if lighthouse cannot run in the environment
            evidenceRegistry.register({
                type: 'lighthouse_unavailable',
                category: 'performance',
                pageUrl: targetUrl,
                status: 'NOT VERIFIED',
                description: `Lighthouse execution could not complete: ${err.message}. Core Web Vitals labeled as NOT VERIFIED.`,
            });
            return {
                performanceScore: null,
                accessibilityScore: null,
                bestPracticesScore: null,
                seoScore: null,
                metrics: {
                    firstContentfulPaintMs: null,
                    largestContentfulPaintMs: null,
                    cumulativeLayoutShift: null,
                    totalBlockingTimeMs: null,
                    speedIndexMs: null,
                    interactiveMs: null,
                },
                audits: [],
                status: 'NOT VERIFIED',
            };
        }
        finally {
            if (chrome) {
                try {
                    await chrome.kill();
                }
                catch {
                    // ignore
                }
            }
        }
    }
}
exports.LighthouseRunner = LighthouseRunner;
