import fs from 'fs';
import path from 'path';
import { auditRunner } from '../server/jobs/auditRunner.js';
import { auditStore } from '../server/storage/auditStore.js';
import { BrowserPool } from '../server/crawler/browserPool.js';
import { CONFIG } from '../server/config.js';

async function runCrawlDepthTest() {
  console.log('\n================================================================');
  console.log('🌐 RUNNING 10+ PAGE CRAWL-DEPTH AUDIT TEST ON PUBLIC BUSINESS WEBSITE');
  console.log('================================================================\n');

  // SOM (Skidmore, Owings & Merrill) - global architecture and interior design studio
  const config = {
    url: 'https://som.com',
    businessName: 'SOM Architecture & Interior Design',
    location: 'Chicago / Global',
    maxPages: 12,
  };

  console.log('Audit Configuration:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\nStarting Crawl and Audit...\n');

  const startTime = Date.now();
  const job = await auditRunner.createAndRunJob(config);
  console.log(`Audit Job ID: ${job.id}`);

  // Monitor progress
  const completionPromise = new Promise<void>((resolve, reject) => {
    const listener = (event: any) => {
      console.log(`  [Progress ${event.progressPercent}%] [${event.status}] ${event.message}`);
      if (event.type === 'complete' || event.status === 'completed') {
        auditRunner.off(`audit:${job.id}`, listener);
        resolve();
      } else if (event.type === 'error' || event.status === 'failed') {
        auditRunner.off(`audit:${job.id}`, listener);
        reject(new Error(event.message));
      }
    };
    auditRunner.on(`audit:${job.id}`, listener);
  });

  await completionPromise;
  const durationSec = Math.round((Date.now() - startTime) / 1000);

  const completedAudit = await auditStore.get(job.id);
  if (!completedAudit) {
    throw new Error('Audit record not found in storage');
  }

  console.log('\n================================================================');
  console.log(`✅ CRAWL DEPTH AUDIT COMPLETED IN ${durationSec}s`);
  console.log('================================================================\n');

  console.log(`Total Pages Crawled: ${completedAudit.pages.length}`);
  console.log(`Total Evidence Records: ${completedAudit.evidenceRegistry.length}`);
  console.log(`Total Findings Identified: ${completedAudit.findings.length}`);
  console.log(`Client PDF Path: ${completedAudit.clientPdfPath}`);
  console.log(`Internal PDF Path: ${completedAudit.internalPdfPath}`);

  // Save crawl test artifacts
  const valDir = path.join(CONFIG.DATA_DIR, 'quality-validation', `crawl-depth-${completedAudit.id}`);
  fs.mkdirSync(valDir, { recursive: true });
  fs.writeFileSync(path.join(valDir, 'audit.json'), JSON.stringify(completedAudit, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valDir, 'pages.json'), JSON.stringify(completedAudit.pages, null, 2), 'utf-8');

  console.log('\n--- PAGES DISCOVERED & AUDITED (IN CRAWL ORDER) ---');
  completedAudit.pages.forEach((p, idx) => {
    console.log(`[Page ${idx + 1}] HTTP ${p.statusCode} (${p.responseTimeMs}ms) - ${p.url}`);
    console.log(`  Title: "${p.title}"`);
    console.log(`  Internal Links Discovered: ${p.internalLinks.length}`);
    console.log(`  Images Found: ${p.images.length}, Headings: ${p.headingTree.length}`);
  });

  // Verification checks
  console.log('\n--- CRAWL DEPTH VERIFICATION CHECKS ---');
  const pageCountCheck = completedAudit.pages.length >= 10;
  console.log(`[CHECK 1] Crawled >= 10 pages: ${pageCountCheck ? 'PASSED (' + completedAudit.pages.length + ' pages)' : 'FAILED (' + completedAudit.pages.length + ' pages)'}`);

  const uniqueUrls = new Set(completedAudit.pages.map((p) => p.url));
  const uniqueCheck = uniqueUrls.size === completedAudit.pages.length;
  console.log(`[CHECK 2] All crawled URLs are unique: ${uniqueCheck ? 'PASSED' : 'FAILED'}`);

  const evidenceCheck = completedAudit.findings.every((f) => f.evidenceIds && f.evidenceIds.length > 0);
  console.log(`[CHECK 3] All findings have non-empty evidence IDs: ${evidenceCheck ? 'PASSED' : 'FAILED'}`);

  const statusCheck = completedAudit.findings.every((f) => ['OBSERVED', 'TESTED', 'INFERRED', 'NOT VERIFIED', 'NOT APPLICABLE'].includes(f.verificationStatus));
  console.log(`[CHECK 4] All findings have valid verification status: ${statusCheck ? 'PASSED' : 'FAILED'}`);

  await BrowserPool.cleanup();

  if (!pageCountCheck || !uniqueCheck || !evidenceCheck || !statusCheck) {
    console.error('\n❌ One or more verification checks failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 10+ PAGE CRAWL DEPTH VERIFICATIONS PASSED SUCCESSFULLY!');
  }
}

runCrawlDepthTest().catch(async (err) => {
  console.error('\n❌ Crawl depth test error:', err);
  await BrowserPool.cleanup();
  process.exit(1);
});
