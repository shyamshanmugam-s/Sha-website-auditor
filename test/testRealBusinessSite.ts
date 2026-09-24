import { auditRunner } from '../server/jobs/auditRunner.js';
import { auditStore } from '../server/storage/auditStore.js';
import { BrowserPool } from '../server/crawler/browserPool.js';
import fs from 'fs';

async function testRealBusinessSite() {
  console.log('\n======================================================');
  console.log('🏢 TESTING END-TO-END AUDIT ON REAL WEBSITE');
  console.log('======================================================\n');

  const targetUrl = 'https://news.ycombinator.com';
  const businessName = 'Hacker News / Y Combinator';
  const location = 'Mountain View, CA';

  console.log(`Launching audit for: ${targetUrl} (${businessName}, ${location})...`);

  const job = await auditRunner.createAndRunJob({
    url: targetUrl,
    businessName,
    location,
    maxPages: 3,
  });

  console.log(`Audit Job Created: ID=${job.id}, Status=${job.status}`);

  // Listen to SSE progress stream
  const completedPromise = new Promise<void>((resolve, reject) => {
    const listener = (event: any) => {
      console.log(`  [Stream Event] ${event.progressPercent}% - ${event.message}`);
      if (event.type === 'complete') {
        auditRunner.off(`audit:${job.id}`, listener);
        resolve();
      } else if (event.type === 'error' || event.status === 'failed') {
        auditRunner.off(`audit:${job.id}`, listener);
        reject(new Error(event.message));
      }
    };
    auditRunner.on(`audit:${job.id}`, listener);
  });

  await completedPromise;

  const completedAudit = await auditStore.get(job.id);
  if (!completedAudit) {
    throw new Error('Audit was not saved in auditStore');
  }

  console.log('\n--- VERIFYING AUDIT COMPLETION ARTIFACTS ---');
  console.log(`Status: ${completedAudit.status}`);
  console.log(`Pages Crawled: ${completedAudit.crawledPagesCount}`);
  console.log(`Evidence Items: ${completedAudit.evidenceRegistry.length}`);
  console.log(`Findings Total: ${completedAudit.findings.length}`);
  console.log(`PDF Path: ${completedAudit.pdfPath}`);

  if (completedAudit.pdfPath && fs.existsSync(completedAudit.pdfPath)) {
    const size = fs.statSync(completedAudit.pdfPath).size;
    console.log(`✅ PDF successfully generated and verified on disk (${size} bytes)`);
  } else {
    throw new Error('PDF file was not created on disk');
  }

  console.log('\n======================================================');
  console.log('🎉 REAL WEBSITE END-TO-END AUDIT TEST PASSED!');
  console.log('======================================================\n');

  await BrowserPool.cleanup();
  process.exit(0);
}

testRealBusinessSite().catch(async (err) => {
  console.error('\n❌ REAL BUSINESS TEST FAILED:', err);
  await BrowserPool.cleanup();
  process.exit(1);
});
