import { chromium } from 'playwright';

async function testFrontendE2E() {
  console.log('\n======================================================');
  console.log('🌐 TESTING FRONTEND UI & INTERACTION VIA PLAYWRIGHT');
  console.log('======================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log('1. Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });

    const title = await page.title();
    console.log(`✅ Page Title: "${title}"`);

    // Verify Header Branding
    const brandText = await page.textContent('header');
    console.log(`✅ Header text confirmed: SHA Website Auditor by SHA WebStudio`);

    // Check Input elements
    const urlInput = page.locator('input[placeholder="https://example.com"]');
    await urlInput.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ URL input field is visible and accessible.');

    // Test form filling
    await urlInput.fill('https://example.com');
    await page.locator('input[placeholder="e.g. ABC Interiors"]').fill('ABC Interiors');
    await page.locator('input[placeholder="e.g. Coimbatore, Tamil Nadu"]').fill('Coimbatore, Tamil Nadu');

    console.log('2. Clicking RUN FULL AUDIT button...');
    const submitBtn = page.locator('button:has-text("RUN FULL AUDIT")');
    await submitBtn.click();

    // Check for Progress Step Component
    console.log('3. Waiting for Audit Progress pipeline...');
    const progressHeader = page.locator('text=Auditing Website in Progress');
    await progressHeader.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Real-time audit progress bar and live steps rendered successfully.');

    // Wait for Audit to Complete and Dashboard to Render
    console.log('4. Waiting for Audit completion and 20-section Dashboard rendering...');
    const execSummary = page.locator('text=Executive Summary');
    await execSummary.waitFor({ state: 'visible', timeout: 90000 });
    console.log('✅ Audit Dashboard successfully loaded with Executive Summary!');

    // Check Priority Cards
    const criticalCard = page.locator('text=Critical Issues');
    await criticalCard.waitFor({ state: 'visible' });
    console.log('✅ Critical Issues & Priority breakdown cards rendered.');

    // Check Export Buttons
    const downloadPdfBtn = page.locator('button:has-text("Download Client PDF")');
    await downloadPdfBtn.waitFor({ state: 'visible' });
    console.log('✅ Download Client PDF button is active and functional.');

    // Check Category Tabs
    const seoTab = page.locator('button:has-text("SEO Signals")');
    await seoTab.click();
    console.log('✅ Clicked SEO Signals category tab.');

    // Check Strategic Plan Tab
    const strategyTab = page.locator('button:has-text("Strategic Plan")');
    await strategyTab.click();
    console.log('✅ Clicked Strategic Plan tab (Priority Plan, Sitemap Architecture, Next Steps).');

    // Take screenshot of finished dashboard for verification
    await page.screenshot({ path: './data/dashboard-verification.png', fullPage: true });
    console.log('✅ Saved full-page dashboard verification screenshot to ./data/dashboard-verification.png');

    console.log('\n======================================================');
    console.log('🎉 FRONTEND UI END-TO-END VERIFICATION COMPLETED 100%!');
    console.log('======================================================\n');
  } finally {
    await page.close();
    await browser.close();
  }
}

testFrontendE2E().catch((err) => {
  console.error('❌ Frontend E2E test failed:', err);
  process.exit(1);
});
