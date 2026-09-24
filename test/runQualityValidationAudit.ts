import fs from 'fs';
import path from 'path';
import { auditRunner } from '../server/jobs/auditRunner.js';
import { auditStore } from '../server/storage/auditStore.js';
import { BrowserPool } from '../server/crawler/browserPool.js';
import { CONFIG } from '../server/config.js';

async function runQualityAudit() {
  console.log('\n================================================================');
  console.log('🏛️ RUNNING COMPREHENSIVE QUALITY AUDIT ON AA INTERIOR DESIGN STUDIO');
  console.log('================================================================\n');

  const config = {
    url: 'http://aainteriordesignstudio.com/',
    businessName: 'AA Interior Design Studio',
    location: 'Coimbatore, Tamil Nadu',
    maxPages: 20,
  };

  console.log('Target Configuration:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\nStarting Audit Execution Flow...\n');

  const startTime = Date.now();
  const job = await auditRunner.createAndRunJob(config);
  console.log(`Audit Job ID: ${job.id}`);

  // Listen to live SSE progress events
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
    throw new Error('Audit data could not be retrieved from store');
  }

  console.log('\n================================================================');
  console.log(`✅ AUDIT FINISHED IN ${durationSec} SECONDS`);
  console.log('================================================================\n');

  // Print high-level telemetry
  console.log(`Status: ${completedAudit.status}`);
  console.log(`Total Pages Crawled: ${completedAudit.pages.length}`);
  console.log(`Evidence Items Registered: ${completedAudit.evidenceRegistry.length}`);
  console.log(`Total Findings Identified: ${completedAudit.findings.length}`);
  console.log(`Client PDF: ${completedAudit.clientPdfPath || completedAudit.pdfPath}`);
  console.log(`Internal PDF: ${completedAudit.internalPdfPath}`);

  // Save audit data snapshot into a dedicated validation output directory
  const valDir = path.join(CONFIG.DATA_DIR, 'quality-validation', completedAudit.id);
  fs.mkdirSync(valDir, { recursive: true });

  fs.writeFileSync(path.join(valDir, 'audit.json'), JSON.stringify(completedAudit, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valDir, 'client-report.json'), JSON.stringify(completedAudit.report?.clientSummary, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valDir, 'executive-summary.json'), JSON.stringify(completedAudit.report?.executiveSummary, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valDir, 'pages-crawled.json'), JSON.stringify(completedAudit.pages, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valDir, 'findings.json'), JSON.stringify(completedAudit.findings, null, 2), 'utf-8');
  fs.writeFileSync(path.join(valDir, 'evidence.json'), JSON.stringify(completedAudit.evidenceRegistry, null, 2), 'utf-8');

  console.log(`\nSaved complete validation artifacts to: ${valDir}`);

  // List all crawled pages
  console.log('\n--- CRAWLED PAGES SUMMARY ---');
  completedAudit.pages.forEach((p, i) => {
    console.log(`[Page ${i + 1}] HTTP ${p.statusCode} (${p.responseTimeMs}ms) - ${p.url}`);
    console.log(`  Title: "${p.title}"`);
    console.log(`  H1s: ${JSON.stringify(p.h1s)}`);
    console.log(`  Internal Links: ${p.internalLinks.length}, Images: ${p.images.length}, Forms: ${p.forms.length}`);
    console.log(`  Contacts: Phones=${JSON.stringify(p.contactSignals.phones)}, Emails=${JSON.stringify(p.contactSignals.emails)}, WhatsApp=${JSON.stringify(p.contactSignals.whatsapps)}`);
    console.log(`  Desktop Screenshot: ${p.desktopScreenshot || 'None'}`);
    console.log(`  Mobile Screenshot: ${p.mobileScreenshot || 'None'}`);
  });

  // List all findings
  console.log('\n--- ALL AUDIT FINDINGS ---');
  completedAudit.findings.forEach((f, i) => {
    console.log(`\n[Finding ${i + 1}] [${f.priority}] [${f.verificationStatus}] [${f.category.toUpperCase()}] ${f.id}: ${f.title}`);
    console.log(`  Observation: ${f.observation}`);
    console.log(`  Evidence: ${f.evidence}`);
    console.log(`  Evidence IDs: ${JSON.stringify(f.evidenceIds)}`);
    console.log(`  Impact: ${f.impact}`);
    console.log(`  Recommendation: ${f.recommendation}`);
  });

  await BrowserPool.cleanup();
}

runQualityAudit().catch(async (err) => {
  console.error('\n❌ Quality validation run failed:', err);
  await BrowserPool.cleanup();
  process.exit(1);
});
