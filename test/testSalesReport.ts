import fs from 'fs';
import path from 'path';
import { auditRunner } from '../server/jobs/auditRunner.js';
import { auditStore } from '../server/storage/auditStore.js';
import { BrowserPool } from '../server/crawler/browserPool.js';
import { SalesReportSynthesizer } from '../server/reporting/salesReportSynthesizer.js';
import { PdfGenerator } from '../server/reporting/pdfGenerator.js';
import { CONFIG } from '../server/config.js';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

function recordResult(id: number, name: string, passed: boolean, notes: string = '') {
  results.push({ id, name, passed, notes });
  const status = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${status} ${id}. ${name} ${notes ? `(${notes})` : ''}`);
}

async function runSalesReportVerification() {
  console.log('\n================================================================');
  console.log('💼 RUNNING SALES AUDIT MODE COMPREHENSIVE TEST SUITE');
  console.log('================================================================\n');

  // Test 1: AA Interior Design Studio (Parked / Holding Domain with User-Provided Info)
  console.log('--- TEST 1: PARKED / HOLDING DOMAIN (AA Interior Design Studio) ---');
  try {
    const job1 = await auditRunner.createAndRunJob({
      url: 'http://aainteriordesignstudio.com/',
      businessName: 'AA Interior Design Studio',
      location: 'Coimbatore, Tamil Nadu',
      maxPages: 5,
    });

    const completedJob1 = await waitForJob(job1.id);
    const salesReport1 = SalesReportSynthesizer.synthesize(completedJob1);

    const isParkedCorrect = salesReport1.isParkedOrIncomplete === true;
    const hasStatusSummary = salesReport1.websiteStatusSummary.length > 20;
    const hasOpportunities = salesReport1.topOpportunities.length >= 3 && salesReport1.topOpportunities.length <= 5;
    const allOpportunitiesHaveEvidence = salesReport1.topOpportunities.every((o) => o.evidenceIds && o.evidenceIds.length > 0);
    const hasStructure = salesReport1.recommendedStructure.length === 5;
    const hasCta = !!salesReport1.agencyCta.title && !!salesReport1.agencyCta.message;
    const hasTechnicalSignals = salesReport1.whatIsWorking.some((w) => w.title.includes('Technical Signal'));

    recordResult(
      1,
      'Parked Domain Detection & Readiness Blueprint',
      isParkedCorrect && hasStatusSummary && hasOpportunities && allOpportunitiesHaveEvidence && hasStructure && hasCta && hasTechnicalSignals,
      `isParked=${salesReport1.isParkedOrIncomplete}, opportunities=${salesReport1.topOpportunities.length}, industry="${salesReport1.industry}"`
    );

    // Test Sales PDF Generation for Job 1
    const salesPdf1 = await PdfGenerator.generate(completedJob1, 'sales');
    const pdf1Exists = fs.existsSync(salesPdf1) && fs.statSync(salesPdf1).size > 20000;
    recordResult(2, 'Parked Domain Sales PDF Generation', pdf1Exists, `Path: ${salesPdf1} (${fs.statSync(salesPdf1).size} bytes)`);
  } catch (err: any) {
    recordResult(1, 'Parked Domain Test', false, err.message);
  }

  // Test 2: Unprovided Business & Location Domain-Inference Test
  console.log('\n--- TEST 2: DOMAIN TOKEN INFERENCE & PROVENANCE (AA Interior Design Studio Unprovided) ---');
  try {
    const jobRaw = await auditRunner.createAndRunJob({
      url: 'http://aainteriordesignstudio.com/',
      maxPages: 1,
    });

    const completedJobRaw = await waitForJob(jobRaw.id);
    const salesReportRaw = SalesReportSynthesizer.synthesize(completedJobRaw);

    const isDomainInferred = salesReportRaw.businessNameProvenance === 'INFERRED FROM DOMAIN';
    const hasCorrectBizName = salesReportRaw.businessName.includes('AA Interior Design Studio');
    const isIndustryInferred = salesReportRaw.industry.includes('Interior') || salesReportRaw.businessType.includes('Interior');
    const isLocationNotProvided = salesReportRaw.location === 'Target location was not provided.';

    // Check for absence of template placeholders in generated report JSON
    const rawReportJson = JSON.stringify(salesReportRaw);
    const hasNoPlaceholders =
      !rawReportJson.includes('"your area"') &&
      !rawReportJson.includes('"Your Business"') &&
      !rawReportJson.includes('"your service area"') &&
      !rawReportJson.includes('[BUSINESS NAME]') &&
      !rawReportJson.includes('[LOCATION]') &&
      !rawReportJson.includes('{{business}}') &&
      !rawReportJson.includes('{{location}}');

    recordResult(
      3,
      'Domain Token Inference, Provenance & Zero Template Placeholders',
      isDomainInferred && hasCorrectBizName && isIndustryInferred && isLocationNotProvided && hasNoPlaceholders,
      `business="${salesReportRaw.businessName}" (${salesReportRaw.businessNameProvenance}), location="${salesReportRaw.location}", placeholdersClean=${hasNoPlaceholders}`
    );
  } catch (err: any) {
    recordResult(3, 'Domain Inference Test', false, err.message);
  }

  // Test 3: Real Manufacturing Business Website
  console.log('\n--- TEST 3: REAL MANUFACTURING BUSINESS (MFG.com) ---');
  try {
    const job2 = await auditRunner.createAndRunJob({
      url: 'https://www.mfg.com',
      businessName: 'MFG Custom Manufacturing Marketplace',
      location: 'USA / Global',
      maxPages: 2,
    });

    const completedJob2 = await waitForJob(job2.id);
    const salesReport2 = SalesReportSynthesizer.synthesize(completedJob2);

    const isManufacturing = salesReport2.industry.includes('Manufacturing');
    const hasRfqSitemap = salesReport2.recommendedStructure.some((p) => p.pageName.includes('Products') || p.pageName.includes('Quote') || p.pageName.includes('Capabilities'));
    const allOpportunitiesGrounded = salesReport2.topOpportunities.every((o) => o.evidenceIds && o.evidenceIds.length > 0);

    recordResult(
      4,
      'Manufacturing Industry Classification & RFQ Blueprint',
      isManufacturing && hasRfqSitemap && allOpportunitiesGrounded,
      `Industry="${salesReport2.industry}", Sitemap Pages=[${salesReport2.recommendedStructure.map((p) => p.pageName).join(', ')}]`
    );
  } catch (err: any) {
    recordResult(4, 'Manufacturing Website Test', false, err.message);
  }

  // Test 4: Restaurant / Hospitality Business Website
  console.log('\n--- TEST 4: RESTAURANT / HOSPITALITY BUSINESS (Sweetgreen) ---');
  try {
    const job3 = await auditRunner.createAndRunJob({
      url: 'https://www.sweetgreen.com',
      businessName: 'Sweetgreen Restaurant & Bowls',
      location: 'Los Angeles / National',
      maxPages: 2,
    });

    const completedJob3 = await waitForJob(job3.id);
    const salesReport3 = SalesReportSynthesizer.synthesize(completedJob3);

    const isRestaurant = salesReport3.industry.includes('Restaurant') || salesReport3.industry.includes('Hospitality');
    const hasMenuSitemap = salesReport3.recommendedStructure.some((p) => p.pageName.includes('Menu') || p.pageName.includes('Reservations') || p.pageName.includes('Gallery'));

    recordResult(
      5,
      'Restaurant Industry Classification & Menu Blueprint',
      isRestaurant && hasMenuSitemap,
      `Industry="${salesReport3.industry}", Sitemap Pages=[${salesReport3.recommendedStructure.map((p) => p.pageName).join(', ')}]`
    );
  } catch (err: any) {
    recordResult(5, 'Restaurant Website Test', false, err.message);
  }

  // Test 5: Architecture & Interior Design Firm
  console.log('\n--- TEST 5: ARCHITECTURE & INTERIOR DESIGN (Gensler) ---');
  try {
    const job4 = await auditRunner.createAndRunJob({
      url: 'https://www.gensler.com',
      businessName: 'Gensler Architecture & Interior Design',
      location: 'Global / San Francisco',
      maxPages: 2,
    });

    const completedJob4 = await waitForJob(job4.id);
    const salesReport4 = SalesReportSynthesizer.synthesize(completedJob4);

    const isArchitecture = salesReport4.industry.includes('Interior') || salesReport4.industry.includes('Architecture');
    const hasPortfolioSitemap = salesReport4.recommendedStructure.some((p) => p.pageName.includes('Portfolio') || p.pageName.includes('Projects'));

    recordResult(
      6,
      'Interior Design / Architecture Classification & Portfolio Blueprint',
      isArchitecture && hasPortfolioSitemap,
      `Industry="${salesReport4.industry}", Sitemap Pages=[${salesReport4.recommendedStructure.map((p) => p.pageName).join(', ')}]`
    );

    // Test Sales PDF for Multi-Page Site
    const salesPdf4 = await PdfGenerator.generate(completedJob4, 'sales');
    const pdf4Exists = fs.existsSync(salesPdf4) && fs.statSync(salesPdf4).size > 25000;
    recordResult(7, 'Multi-Page Live Site Sales PDF Generation', pdf4Exists, `Path: ${salesPdf4} (${fs.statSync(salesPdf4).size} bytes)`);
  } catch (err: any) {
    recordResult(6, 'Architecture Website Test', false, err.message);
  }

  // Test 6: Defensible Client Language & Absence of Hype Phrases
  console.log('\n--- TEST 6: CLIENT LANGUAGE & UNSUPPORTED CLAIMS SANITIZATION ---');
  try {
    const sampleJob = (await auditStore.list(1))[0];
    if (sampleJob) {
      const fullAudit = await auditStore.get(sampleJob.id);
      if (fullAudit) {
        const sales = SalesReportSynthesizer.synthesize(fullAudit);
        const reportText = JSON.stringify(sales);

        // Verify absence of hype phrases and raw developer jargon
        const forbiddenPhrases = [
          'market leader',
          'turn traffic into paying clients',
          'accelerate your business growth',
          'Standardize Google Heading Structure',
          '"DOM"',
          '"HTTP response headers"',
          '"JavaScript bundle"',
          '"ARIA tree"',
        ];
        const phrasesFound = forbiddenPhrases.filter((p) => reportText.includes(p));
        const cleanLanguage = phrasesFound.length === 0;

        // Verify valid verification statuses
        const validStatuses = ['OBSERVED', 'TESTED', 'INFERRED', 'NOT VERIFIED', 'NOT APPLICABLE'];
        const statusesValid = sales.topOpportunities.every((o) => validStatuses.includes(o.status));

        recordResult(
          8,
          'Defensible Client Language, Heading Hierarchy Terminology & Status Integrity',
          cleanLanguage && statusesValid,
          `Forbidden phrases detected: ${phrasesFound.length === 0 ? 'None (Clean)' : phrasesFound.join(', ')}`
        );
      }
    }
  } catch (err: any) {
    recordResult(8, 'Language Verification', false, err.message);
  }

  await BrowserPool.cleanup();

  console.log('\n================================================================');
  console.log(`📊 SALES AUDIT TEST RESULTS: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log('================================================================\n');

  if (results.some((r) => !r.passed)) {
    console.error('❌ One or more sales audit tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 ALL SALES AUDIT MODE CRITERIA 100% ACHIEVED!');
  }
}

async function waitForJob(jobId: string): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const check = async () => {
      const audit = await auditStore.get(jobId);
      if (audit) {
        if (audit.status === 'completed') {
          resolve(audit);
          return;
        } else if (audit.status === 'failed' || audit.status === 'cancelled') {
          reject(new Error(audit.error || 'Audit job failed'));
          return;
        }
      }
      setTimeout(check, 1000);
    };
    check();
  });
}

runSalesReportVerification().catch(async (err) => {
  console.error('\n❌ Fatal error during sales audit verification:', err);
  await BrowserPool.cleanup();
  process.exit(1);
});
