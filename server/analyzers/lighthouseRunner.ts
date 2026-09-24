import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { LighthouseResult, VerificationStatus } from '../types/audit.js';
import { EvidenceRegistry } from '../evidence/evidenceRegistry.js';

export class LighthouseRunner {
  /**
   * Runs Lighthouse on the given URL to measure official Core Web Vitals, Performance, Accessibility, Best Practices, and SEO.
   */
  public static async run(
    targetUrl: string,
    evidenceRegistry: EvidenceRegistry
  ): Promise<LighthouseResult> {
    let chrome: any = null;

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
        logLevel: 'error' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
      };

      const runnerResult = await lighthouse(targetUrl, options);

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
        .filter(([_, a]: [string, any]) => a.score !== null && a.score < 1)
        .slice(0, 20)
        .map(([id, a]: [string, any]) => ({
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
    } catch (err: any) {
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
    } finally {
      if (chrome) {
        try {
          await chrome.kill();
        } catch {
          // ignore
        }
      }
    }
  }
}
