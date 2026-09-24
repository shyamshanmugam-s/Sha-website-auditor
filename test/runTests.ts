import { validateUrlForSSRF } from '../server/security/ssrfGuard.js';
import { EvidenceRegistry } from '../server/evidence/evidenceRegistry.js';
import { CrawlerEngine } from '../server/crawler/crawlerEngine.js';
import { LighthouseRunner } from '../server/analyzers/lighthouseRunner.js';
import { HeuristicProvider } from '../server/ai/heuristicProvider.js';
import { ReportSynthesizer } from '../server/reporting/reportSynthesizer.js';
import { PdfGenerator } from '../server/reporting/pdfGenerator.js';
import { AuditJob } from '../server/types/audit.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE SHA WEBSITE AUDITOR TEST SUITE');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // 1. SSRF & Security Validation Tests
  // ---------------------------------------------------------
  console.log('--- TEST GROUP 1: SSRF & URL Security Guards ---');

  const ssrfLocalhost = await validateUrlForSSRF('http://localhost:3000');
  assert(!ssrfLocalhost.allowed, 'SSRF Block: http://localhost:3000 must be rejected');

  const ssrf127 = await validateUrlForSSRF('http://127.0.0.1:8080');
  assert(!ssrf127.allowed, 'SSRF Block: http://127.0.0.1 must be rejected');

  const ssrfMeta = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data');
  assert(!ssrfMeta.allowed, 'SSRF Block: Cloud metadata 169.254.169.254 must be rejected');

  const ssrfFile = await validateUrlForSSRF('file:///etc/passwd');
  assert(!ssrfFile.allowed, 'SSRF Block: file:// protocol must be rejected');

  const ssrfPrivate10 = await validateUrlForSSRF('http://10.0.0.1');
  assert(!ssrfPrivate10.allowed, 'SSRF Block: Private RFC 1918 10.0.0.1 must be rejected');

  const ssrfValidPublic = await validateUrlForSSRF('https://example.com');
  assert(ssrfValidPublic.allowed, 'SSRF Allow: https://example.com must be permitted');

  // ---------------------------------------------------------
  // 2. Evidence Registry & Atomic ID Tests
  // ---------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Evidence Registry & E-001 ID Sequence ---');
  const registry = new EvidenceRegistry();
  const ev1 = registry.register({
    type: 'test_check',
    category: 'technical',
    pageUrl: 'https://example.com',
    status: 'TESTED',
    description: 'First test evidence',
    metricValue: 100,
  });
  assert(ev1.id === 'E-001', 'Evidence ID sequence starts at E-001');

  const ev2 = registry.register({
    type: 'test_check_2',
    category: 'seo',
    pageUrl: 'https://example.com',
    status: 'OBSERVED',
    description: 'Second test evidence',
  });
  assert(ev2.id === 'E-002', 'Evidence ID sequence increments to E-002');
  assert(registry.getAll().length === 2, 'Evidence registry stores records properly');

  // ---------------------------------------------------------
  // 3. Crawler & Multi-Viewport Screenshot Test (example.com)
  // ---------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Real Crawler & Viewport Capture (example.com) ---');
  const auditId = uuidv4();
  const testRegistry = new EvidenceRegistry();

  const crawledPages = await CrawlerEngine.crawl(
    'https://example.com',
    auditId,
    testRegistry,
    5,
    {
      onProgress: (p, msg) => console.log(`    [Crawler Progress ${p}%] ${msg}`),
    }
  );

  assert(crawledPages.length >= 1, 'Crawled at least 1 page for example.com');
  const homePage = crawledPages[0];
  assert(homePage.statusCode === 200, 'Homepage returned HTTP 200');
  assert(homePage.title.length > 0, `Homepage title extracted: "${homePage.title}"`);
  assert(!!homePage.desktopScreenshot, 'Desktop screenshot captured successfully');
  assert(!!homePage.mobileScreenshot, 'Mobile screenshot captured successfully');

  // Check that screenshot files actually exist on disk
  const deskFile = `./data${homePage.desktopScreenshot}`;
  const mobFile = `./data${homePage.mobileScreenshot}`;
  assert(fs.existsSync(deskFile), `Desktop screenshot file exists on disk: ${deskFile}`);
  assert(fs.existsSync(mobFile), `Mobile screenshot file exists on disk: ${mobFile}`);

  // ---------------------------------------------------------
  // 4. Deterministic AI / Heuristic Provider Test
  // ---------------------------------------------------------
  console.log('\n--- TEST GROUP 4: AI Heuristic Synthesis Engine ---');
  const heuristic = new HeuristicProvider();
  assert(heuristic.isAvailable(), 'Heuristic Provider is available offline');

  const aiResult = await heuristic.synthesize({
    url: 'https://example.com',
    businessName: 'Example Domain Corp',
    location: 'Global',
    pages: crawledPages,
    evidence: testRegistry.getAll(),
  });

  assert(!!aiResult.executiveSummary, 'Executive summary generated');
  assert(aiResult.topStrengths.length > 0, 'Top strengths generated');
  assert(aiResult.topRisks.length > 0, 'Top risks identified');
  assert(aiResult.recommendedSitemap.length > 0, 'Recommended sitemap generated');
  assert(aiResult.priorityPlan.length > 0, 'Priority improvement plan generated');

  // ---------------------------------------------------------
  // 5. Report 20-Section Synthesis Test
  // ---------------------------------------------------------
  console.log('\n--- TEST GROUP 5: 20-Section Report Synthesis ---');
  const lighthouseMock = {
    performanceScore: 98,
    accessibilityScore: 95,
    bestPracticesScore: 100,
    seoScore: 90,
    metrics: {
      firstContentfulPaintMs: 650,
      largestContentfulPaintMs: 900,
      cumulativeLayoutShift: 0.0,
      totalBlockingTimeMs: 0,
      speedIndexMs: 700,
      interactiveMs: 650,
    },
    audits: [],
    status: 'TESTED' as const,
  };

  const { report, allFindings } = ReportSynthesizer.synthesize(
    { url: 'https://example.com', businessName: 'Example Corp', location: 'Global' },
    crawledPages,
    testRegistry,
    lighthouseMock,
    aiResult,
    12
  );

  assert(!!report.executiveSummary, 'Section 1: Executive Summary present');
  assert(!!report.websiteOverview, 'Section 2: Website Overview present');
  assert(report.pagesInspected.length > 0, 'Section 3: Pages Inspected present');
  assert(report.keyStrengths.length > 0, 'Section 4: Key Strengths present');
  assert(!!report.visualDesignAudit, 'Section 6: Visual Design Audit present');
  assert(!!report.uxAudit, 'Section 7: UX Audit present');
  assert(!!report.mobileExperience, 'Section 8: Mobile Experience present');
  assert(!!report.contentAudit, 'Section 9: Content Audit present');
  assert(!!report.conversionLeadGenAudit, 'Section 10: Conversion Audit present');
  assert(!!report.seoAudit, 'Section 11: SEO Audit present');
  assert(!!report.technicalAudit, 'Section 12: Technical Audit present');
  assert(!!report.performanceAudit, 'Section 13: Performance Audit present');
  assert(!!report.accessibilityAudit, 'Section 14: Accessibility Audit present');
  assert(!!report.localSeoOpportunities, 'Section 15: Local SEO Opportunities present');
  assert(!!report.securityObservations, 'Section 16: Security Observations present');
  assert(report.priorityImprovementPlan.length > 0, 'Section 17: Priority Improvement Plan present');
  assert(!!report.recommendedWebsiteStructure, 'Section 18: Recommended Website Structure present');
  assert(!!report.recommendedRedesignStrategy, 'Section 19: Recommended Redesign Strategy present');
  assert(report.nextSteps.length > 0, 'Section 20: Next Steps present');

  // Verify verification status rigor
  allFindings.forEach((f) => {
    assert(
      ['OBSERVED', 'TESTED', 'INFERRED', 'NOT VERIFIED', 'NOT APPLICABLE'].includes(f.verificationStatus),
      `Finding ${f.id} has valid verificationStatus: ${f.verificationStatus}`
    );
    assert(
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(f.priority),
      `Finding ${f.id} has valid priority: ${f.priority}`
    );
  });

  // ---------------------------------------------------------
  // 6. PDF Generation Test
  // ---------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Client-Ready PDF Report Generation ---');
  const dummyAudit: AuditJob = {
    id: auditId,
    config: { url: 'https://example.com', businessName: 'Example Corp', location: 'Global' },
    status: 'completed',
    createdAt: new Date().toISOString(),
    progressPercent: 100,
    currentStepMessage: 'Audit completed',
    crawledPagesCount: crawledPages.length,
    totalPagesToCrawl: 5,
    pages: crawledPages,
    evidenceRegistry: testRegistry.getAll(),
    findings: allFindings,
    report,
  };

  const pdfPath = await PdfGenerator.generate(dummyAudit);
  assert(fs.existsSync(pdfPath), `PDF file successfully created: ${pdfPath}`);
  const pdfStats = fs.statSync(pdfPath);
  assert(pdfStats.size > 5000, `PDF size is valid and contains pages (${pdfStats.size} bytes)`);

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');

  await BrowserPool.cleanup();
  process.exit(0);
}

runTestSuite().catch(async (err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  await BrowserPool.cleanup();
  process.exit(1);
});
