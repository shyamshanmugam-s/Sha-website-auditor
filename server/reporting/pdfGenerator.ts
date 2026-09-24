import fs from 'fs/promises';
import path from 'path';
import { BrowserPool } from '../crawler/browserPool.js';
import { AuditJob, Priority, SalesReport } from '../types/audit.js';
import { CONFIG } from '../config.js';
import { escapeHtml, sanitizeText } from '../security/sanitizer.js';
import { SalesReportSynthesizer } from './salesReportSynthesizer.js';

export type PdfMode = 'client' | 'internal' | 'sales';

export class PdfGenerator {
  /**
   * Generates a professional branded PDF report for an audit job in Client, Internal, or Sales mode.
   */
  public static async generate(audit: AuditJob, mode: PdfMode = 'client'): Promise<string> {
    const report = audit.report;
    if (!report && mode !== 'sales') {
      throw new Error('Cannot generate PDF: Audit report data is missing');
    }

    const pdfDir = CONFIG.PDFS_DIR;
    await fs.mkdir(pdfDir, { recursive: true });
    const pdfFilename = `audit-${audit.id}-${mode}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);

    // Read base64 screenshots if available
    let desktopScreenshotBase64 = '';
    let mobileScreenshotBase64 = '';

    const homePage = audit.pages[0];
    if (homePage?.desktopScreenshot) {
      try {
        const fullPath = path.join(CONFIG.DATA_DIR, homePage.desktopScreenshot.replace(/^\//, ''));
        const buffer = await fs.readFile(fullPath);
        desktopScreenshotBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
      } catch {
        // continue
      }
    }

    if (homePage?.mobileScreenshot) {
      try {
        const fullPath = path.join(CONFIG.DATA_DIR, homePage.mobileScreenshot.replace(/^\//, ''));
        const buffer = await fs.readFile(fullPath);
        mobileScreenshotBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
      } catch {
        // continue
      }
    }

    const htmlContent =
      mode === 'sales'
        ? this.buildSalesReportHtml(audit, desktopScreenshotBase64, mobileScreenshotBase64)
        : mode === 'client'
        ? this.buildClientReportHtml(audit, desktopScreenshotBase64, mobileScreenshotBase64)
        : this.buildInternalReportHtml(audit, desktopScreenshotBase64, mobileScreenshotBase64);

    const context = await BrowserPool.createSecureContext();
    const page = await context.newPage();

    try {
      await page.setContent(htmlContent, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          bottom: '15mm',
          left: '15mm',
          right: '15mm',
        },
      });

      return pdfPath;
    } finally {
      await page.close();
      await BrowserPool.closeContext(context);
    }
  }

  /**
   * Builds the Client-Facing Report (Business-oriented, jargon-free, conversion & growth focused).
   */
  private static buildClientReportHtml(
    audit: AuditJob,
    desktopImg: string,
    mobileImg: string
  ): string {
    const report = audit.report!;
    const clientSum = report.clientSummary;
    const dateStr = new Date(audit.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const top5Html = (clientSum?.top5Opportunities || [])
      .map(
        (opp) => `
      <div class="card" style="margin-bottom: 12px; border-left: 4px solid #38BDF8;">
        <h4 style="font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${escapeHtml(opp.title)}</h4>
        <p style="font-size: 12px; color: #475569; margin-bottom: 6px;"><strong>Business Impact:</strong> ${escapeHtml(opp.businessImpact)}</p>
        <p style="font-size: 12px; color: #0284C7; font-weight: 600;"><strong>Recommended Action:</strong> ${escapeHtml(opp.recommendedAction)}</p>
      </div>
    `
      )
      .join('');

    const strengthsHtml = (clientSum?.currentStrengths || report.executiveSummary.topStrengths || [])
      .map((str) => `<li style="margin-bottom: 6px;">${escapeHtml(str)}</li>`)
      .join('');

    const structureHtml = (clientSum?.recommendedWebsiteStructure || report.recommendedWebsiteStructure.suggestedSitemap || [])
      .map(
        (s) => `
      <div class="card" style="margin-bottom: 10px;">
        <div style="font-weight: 700; font-size: 13px; color: #0F172A;">${escapeHtml(s.pageName)}</div>
        <div style="font-size: 12px; color: #475569; margin: 3px 0;">${escapeHtml(s.purpose)}</div>
        ${s.keySections ? `<div style="font-size: 11px; color: #64748B;"><strong>Recommended Sections:</strong> ${s.keySections.map((k) => escapeHtml(k)).join(' • ')}</div>` : ''}
      </div>
    `
      )
      .join('');

    const nextStepsHtml = (clientSum?.nextSteps || report.nextSteps.map((n) => ({ step: `${n.title}: ${n.description}`, timeframe: n.timelineRecommendation })))
      .map(
        (step, i) => `
      <div style="display: flex; gap: 12px; align-items: flex-start; padding: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 8px;">
        <div style="width: 22px; height: 22px; background: #0284C7; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0;">${i + 1}</div>
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 700; color: #0F172A;">${escapeHtml(step.step)}</div>
          <div style="font-size: 11px; color: #0284C7; font-weight: 600; margin-top: 2px;">Target Timeline: ${escapeHtml(step.timeframe)}</div>
        </div>
      </div>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Website Strategic Report - ${escapeHtml(audit.config.url)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      font-size: 11.5px;
      line-height: 1.6;
      word-break: break-word;
      overflow-wrap: break-word;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3, h4 { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
    .page-break { page-break-after: always; break-after: page; }
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 14px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 12px;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 6px;
      letter-spacing: -0.3px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div style="padding: 48px 36px; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; border-radius: 12px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFF;">
    <div>
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #38BDF8;">SHA WebStudio • Client Report</div>
      <h1 style="font-size: 28px; font-weight: 800; line-height: 1.25; margin: 16px 0 10px 0; color: #F8FAFC;">Website Performance & Growth Strategy</h1>
      <p style="font-size: 13px; color: #94A3B8; max-width: 520px; line-height: 1.5;">A comprehensive, jargon-free executive review of visual presentation, mobile experience, customer discovery, and high-impact conversion opportunities.</p>
    </div>
    <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 18px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Target Website</span><strong style="font-size: 13px; color: #F1F5F9; word-break: break-all;">${escapeHtml(audit.config.url)}</strong></div>
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Report Date</span><strong style="font-size: 13px; color: #F1F5F9;">${dateStr}</strong></div>
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Business Name</span><strong style="font-size: 13px; color: #F1F5F9;">${escapeHtml(audit.config.businessName || 'Business name not provided')}</strong></div>
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Target Location</span><strong style="font-size: 13px; color: #F1F5F9;">${escapeHtml(audit.config.location || 'Target location was not provided.')}</strong></div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- CLIENT SUMMARY & TOP OPPORTUNITIES -->
  <div style="padding: 10px 0;">
    <h2 class="section-title">1. Executive Overview & Top 5 Opportunities</h2>
    <div class="card" style="margin-bottom: 14px; background: #F0F9FF; border-color: #BAE6FD;">
      <p style="font-size: 12px; color: #0369A1; font-weight: 500; line-height: 1.6;">${escapeHtml(clientSum?.overview || report.executiveSummary.summary)}</p>
    </div>

    <h3 style="font-size: 13px; font-weight: 700; color: #0F172A; margin: 14px 0 8px 0;">Top 5 Growth & Conversion Opportunities</h3>
    ${top5Html}

    <div style="margin-top: 14px;" class="card">
      <h3 style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">Key Current Strengths</h3>
      <ul style="padding-left: 18px; color: #334155; font-size: 11.5px;">
        ${strengthsHtml}
      </ul>
    </div>
  </div>

  ${
    desktopImg || mobileImg
      ? `
  <div class="page-break"></div>
  <div style="padding: 10px 0;">
    <h2 class="section-title">2. Visual & Mobile Presentation</h2>
    <p style="color: #475569; margin-bottom: 12px; font-size: 11.5px;">How prospective clients experience your website across desktop computers and mobile devices.</p>
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 14px; align-items: flex-start;">
      ${desktopImg ? `<div class="card" style="padding: 8px; text-align: center;"><img src="${desktopImg}" style="width: 100%; max-height: 360px; object-fit: contain; border-radius: 4px;" /><div style="font-size: 10px; font-weight: bold; color: #64748B; margin-top: 6px;">Desktop Viewport (1440x900)</div></div>` : ''}
      ${mobileImg ? `<div class="card" style="padding: 8px; text-align: center;"><img src="${mobileImg}" style="width: 100%; max-height: 360px; object-fit: contain; border-radius: 4px;" /><div style="font-size: 10px; font-weight: bold; color: #64748B; margin-top: 6px;">Mobile Smartphone (390x844)</div></div>` : ''}
    </div>
  </div>
  `
      : ''
  }

  <div class="page-break"></div>

  <!-- SITEMAP & NEXT STEPS -->
  <div style="padding: 10px 0;">
    <h2 class="section-title">3. Recommended Website Structure & Next Steps</h2>
    <p style="color: #475569; margin-bottom: 12px; font-size: 11.5px;">Optimized sitemap blueprint engineered to attract qualified visitors and turn traffic into commercial inquiries.</p>
    ${structureHtml}

    <h3 style="font-size: 13px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0;">Recommended Implementation Roadmap</h3>
    ${nextStepsHtml}
  </div>

  <div style="text-align: center; font-size: 9.5px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 10px;">
    SHA Website Auditor • Produced by SHA WebStudio • Confidential Client Delivery
  </div>
</body>
</html>
    `;
  }

  /**
   * Builds the Internal Technical Audit Report (Complete telemetry, evidence IDs, security response headers, raw metrics).
   */
  private static buildInternalReportHtml(
    audit: AuditJob,
    desktopImg: string,
    mobileImg: string
  ): string {
    const report = audit.report!;
    const counts = report.executiveSummary.findingsCountByPriority;
    const dateStr = new Date(audit.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const findingsHtml = audit.findings
      .map((f) => {
        const priorityColors: Record<string, string> = {
          CRITICAL: '#DC2626',
          HIGH: '#EA580C',
          MEDIUM: '#D97706',
          LOW: '#2563EB',
        };
        const color = priorityColors[f.priority] || '#4B5563';

        return `
        <div class="finding-card">
          <div style="display: flex; gap: 6px; margin-bottom: 6px;">
            <span style="background: ${color}; color: #FFF; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">${escapeHtml(f.priority)}</span>
            <span style="background: #E2E8F0; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">${escapeHtml(f.verificationStatus)}</span>
            <span style="background: #0F172A; color: #38BDF8; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-family: monospace;">${escapeHtml(f.category.toUpperCase())}</span>
            ${f.evidenceIds?.length ? `<span style="color: #0284C7; font-size: 9px; font-family: monospace;">${f.evidenceIds.join(', ')}</span>` : ''}
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${escapeHtml(f.title)}</h4>
          <p style="font-size: 11px; color: #334155; margin-bottom: 6px;"><strong>Observation:</strong> ${escapeHtml(f.observation)}</p>
          ${f.evidence ? `<div style="background: #F1F5F9; padding: 6px; border-radius: 4px; font-family: monospace; font-size: 10px; color: #475569; margin-bottom: 6px;"><strong>Evidence:</strong> ${escapeHtml(f.evidence)}</div>` : ''}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10px; background: #F8FAFC; padding: 8px; border-radius: 4px;">
            <div><strong>Impact:</strong> ${escapeHtml(f.impact)}</div>
            <div><strong>Recommendation:</strong> ${escapeHtml(f.recommendation)}</div>
          </div>
        </div>
      `;
      })
      .join('');

    const pagesRows = audit.pages
      .map(
        (p) => `
      <tr>
        <td style="font-weight: bold; color: ${p.statusCode === 200 ? '#16A34A' : '#DC2626'};">${p.statusCode}</td>
        <td style="max-width: 200px; word-break: break-all; font-family: monospace; font-size: 10px;">${escapeHtml(p.url)}</td>
        <td>${escapeHtml(p.title || 'Untitled')}</td>
        <td>${p.responseTimeMs}ms</td>
        <td>${p.consoleErrors.length} JS / ${p.networkErrors.length} Net</td>
      </tr>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal Technical Audit - ${escapeHtml(audit.config.url)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1E293B; background: #FFF; font-size: 11px; line-height: 1.5; word-break: break-word; }
    .page-break { page-break-after: always; }
    .section-title { font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 10px; border-bottom: 2px solid #E2E8F0; padding-bottom: 4px; }
    .finding-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 10px; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
    th, td { padding: 6px 8px; border: 1px solid #E2E8F0; text-align: left; }
    th { background: #F1F5F9; font-weight: 700; }
  </style>
</head>
<body>

  <!-- COVER / HEADER -->
  <div style="padding: 20px; background: #0F172A; color: #FFF; border-radius: 8px; margin-bottom: 20px;">
    <div style="font-size: 10px; color: #38BDF8; font-family: monospace; font-weight: bold;">SHA WEBSTUDIO • INTERNAL TECHNICAL AUDIT TELEMETRY</div>
    <h1 style="font-size: 22px; font-weight: 800; margin: 8px 0;">Technical Evidence & Audit Diagnostics</h1>
    <div style="font-size: 11px; color: #94A3B8;">Target URL: ${escapeHtml(audit.config.url)} • Audit ID: ${audit.id} • Date: ${dateStr}</div>
  </div>

  <!-- FINDINGS STATS -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
    <div style="background: #FEF2F2; border: 1px solid #F87171; padding: 10px; border-radius: 6px; text-align: center;">
      <div style="font-size: 20px; font-weight: 800; color: #DC2626;">${counts.CRITICAL}</div>
      <div style="font-size: 10px; font-weight: bold; color: #991B1B;">CRITICAL</div>
    </div>
    <div style="background: #FFFBEB; border: 1px solid #FBBF24; padding: 10px; border-radius: 6px; text-align: center;">
      <div style="font-size: 20px; font-weight: 800; color: #D97706;">${counts.HIGH}</div>
      <div style="font-size: 10px; font-weight: bold; color: #92400E;">HIGH</div>
    </div>
    <div style="background: #FEFCE8; border: 1px solid #FDE047; padding: 10px; border-radius: 6px; text-align: center;">
      <div style="font-size: 20px; font-weight: 800; color: #CA8A04;">${counts.MEDIUM}</div>
      <div style="font-size: 10px; font-weight: bold; color: #854D0E;">MEDIUM</div>
    </div>
    <div style="background: #F0F9FF; border: 1px solid #7DD3FC; padding: 10px; border-radius: 6px; text-align: center;">
      <div style="font-size: 20px; font-weight: 800; color: #0284C7;">${counts.LOW}</div>
      <div style="font-size: 10px; font-weight: bold; color: #075985;">LOW</div>
    </div>
  </div>

  <!-- PAGES TABLE -->
  <h2 class="section-title">Crawled Pages & HTTP Status</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>URL</th>
        <th>Title</th>
        <th>Timing</th>
        <th>Console / Network</th>
      </tr>
    </thead>
    <tbody>
      ${pagesRows}
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- DETAILED FINDINGS WITH EVIDENCE IDS -->
  <h2 class="section-title">Technical Findings & Evidence Registry</h2>
  ${findingsHtml}

  <div style="text-align: center; font-size: 10px; color: #94A3B8; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 12px;">
    SHA Website Auditor • Internal Technical Inspection • SHA WebStudio
  </div>
</body>
</html>
    `;
  }

  /**
   * Builds the Client Sales Report PDF (Persuasive, non-technical, grounded in evidence, dynamic sitemap, ~2-4 pages).
   */
  private static buildSalesReportHtml(
    audit: AuditJob,
    desktopImg: string,
    mobileImg: string
  ): string {
    const sales = audit.salesReport || SalesReportSynthesizer.synthesize(audit);
    const dateStr = new Date(audit.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const workingHtml = sales.whatIsWorking
      .map(
        (w) => `
      <div class="card" style="margin-bottom: 8px; border-left: 4px solid #10B981; background: #F0FDF4;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <strong style="font-size: 12px; color: #065F46;">${escapeHtml(w.title)}</strong>
          <span style="font-size: 9px; font-weight: bold; background: #DCFCE7; color: #166534; padding: 2px 6px; border-radius: 4px;">${escapeHtml(w.status)} • ${w.evidenceIds.join(', ')}</span>
        </div>
        <p style="font-size: 11px; color: #15803D; line-height: 1.4;">${escapeHtml(w.explanation)}</p>
      </div>
    `
      )
      .join('');

    const opportunitiesHtml = sales.topOpportunities
      .map((opp, idx) => {
        const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
          CRITICAL: { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444' },
          HIGH: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' },
          MEDIUM: { bg: '#F0F9FF', text: '#0369A1', border: '#38BDF8' },
          LOW: { bg: '#F8FAFC', text: '#334155', border: '#94A3B8' },
        };
        const style = priorityColors[opp.priority] || priorityColors.MEDIUM;

        return `
        <div class="card" style="margin-bottom: 10px; border-left: 4px solid ${style.border};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <h4 style="font-size: 13px; font-weight: 700; color: #0F172A;">${idx + 1}. ${escapeHtml(opp.title)}</h4>
            <div style="display: flex; gap: 4px;">
              <span style="background: ${style.bg}; color: ${style.text}; font-size: 8.5px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${escapeHtml(opp.priority)}</span>
              <span style="background: #F1F5F9; color: #475569; font-size: 8.5px; font-family: monospace; padding: 2px 6px; border-radius: 4px;">${opp.evidenceIds.join(', ')}</span>
            </div>
          </div>
          <p style="font-size: 11px; color: #475569; margin-bottom: 4px;"><strong>Current Observation:</strong> ${escapeHtml(opp.clientObservation)}</p>
          <p style="font-size: 11px; color: #0F172A; margin-bottom: 4px;"><strong>Business Impact:</strong> ${escapeHtml(opp.businessImpact)}</p>
          <div style="background: #F0F9FF; border: 1px solid #BAE6FD; padding: 6px 10px; border-radius: 4px; font-size: 11px; color: #0284C7; font-weight: 600;">
            👉 <strong>Recommended Action:</strong> ${escapeHtml(opp.recommendedAction)}
          </div>
        </div>
      `;
      })
      .join('');

    const structureHtml = sales.recommendedStructure
      .map(
        (s) => `
      <div class="card" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <strong style="font-size: 12px; color: #0F172A;">📄 ${escapeHtml(s.pageName)}</strong>
          <span style="font-size: 8px; color: #0284C7; font-weight: bold; background: #E0F2FE; padding: 2px 6px; border-radius: 4px;">STRATEGIC PROPOSAL (PROPOSED / REQUIRES CLIENT APPROVAL)</span>
        </div>
        <p style="font-size: 11px; color: #475569; margin-bottom: 4px;">${escapeHtml(s.purpose)}</p>
        <div style="font-size: 10px; color: #64748B;"><strong>Key Conversion Sections:</strong> ${s.keySections.map((k) => escapeHtml(k)).join(' • ')}</div>
      </div>
    `
      )
      .join('');

    const roadmapHtml = sales.implementationRoadmap
      .map(
        (r, i) => `
      <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 6px;">
        <div style="background: #0284C7; color: #FFF; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; flex-shrink: 0;">${i + 1}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <strong style="font-size: 11.5px; color: #0F172A;">${escapeHtml(r.title)}</strong>
            <span style="font-size: 10px; color: #0284C7; font-weight: 600;">${escapeHtml(r.timeframe)}</span>
          </div>
          <p style="font-size: 10.5px; color: #475569;">${escapeHtml(r.description)}</p>
        </div>
      </div>
    `
      )
      .join('');

    const displayBizNameHtml =
      sales.businessNameProvenance === 'USER_PROVIDED'
        ? escapeHtml(sales.businessName)
        : sales.businessNameProvenance === 'INFERRED FROM DOMAIN'
        ? `${escapeHtml(sales.businessName)} <span style="font-size: 8.5px; color: #38BDF8; font-weight: normal;">(INFERRED FROM DOMAIN)</span>`
        : sales.businessNameProvenance === 'INFERRED FROM WEBSITE'
        ? `${escapeHtml(sales.businessName)} <span style="font-size: 8.5px; color: #38BDF8; font-weight: normal;">(INFERRED FROM WEBSITE)</span>`
        : `<span style="color: #94A3B8; font-weight: normal;">Business name not provided</span>`;

    const displayLocationHtml =
      sales.locationProvenance !== 'NOT_PROVIDED'
        ? escapeHtml(sales.location)
        : `<span style="color: #94A3B8; font-weight: normal;">Target location was not provided.</span>`;

    const provenanceLabel =
      sales.classificationProvenance === 'USER_PROVIDED'
        ? 'USER PROVIDED'
        : sales.classificationProvenance === 'STRUCTURED_DATA'
        ? 'STRUCTURED DATA'
        : sales.classificationProvenance === 'WEBSITE_EVIDENCE'
        ? 'INFERRED FROM WEBSITE EVIDENCE'
        : sales.classificationProvenance === 'DOMAIN_TOKEN'
        ? 'INFERRED FROM DOMAIN'
        : sales.classificationProvenance === 'AI_INFERRED'
        ? 'AI INFERRED'
        : 'INSUFFICIENT EVIDENCE';

    const industryDisplay =
      sales.businessType && sales.businessType !== sales.industry && sales.businessType !== 'Unknown Business Type'
        ? `${sales.businessType} (${sales.industry})`
        : sales.industry;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Client Sales Audit - ${escapeHtml(audit.config.url)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.5;
      word-break: break-word;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3, h4 { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
    .page-break { page-break-after: always; break-after: page; }
    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 10px;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 4px;
      letter-spacing: -0.2px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div style="padding: 36px 28px; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; border-radius: 10px; background: linear-gradient(135deg, #0B132B 0%, #1C2541 100%); color: #FFF;">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #38BDF8;">SHA WebStudio • Client Sales Audit</span>
        <span style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; padding: 3px 8px; border-radius: 4px; font-size: 8.5px; font-weight: bold; border: 1px solid rgba(56, 189, 248, 0.3);">${escapeHtml(industryDisplay)} • ${escapeHtml(sales.industryConfidence)} • ${escapeHtml(provenanceLabel)}</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 800; line-height: 1.25; margin: 16px 0 8px 0; color: #F8FAFC;">Website Commercial Strategy & Growth Audit</h1>
      <p style="font-size: 12px; color: #94A3B8; max-width: 500px; line-height: 1.5;">A concise, business-first review of digital credibility, visitor conversion pathways, local market discovery, and high-impact website improvements.</p>
    </div>

    <!-- TARGET DETAILS -->
    <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 14px 18px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Business Name</span><strong style="font-size: 12px; color: #F1F5F9;">${displayBizNameHtml}</strong></div>
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Audit Date</span><strong style="font-size: 12px; color: #F1F5F9;">${dateStr}</strong></div>
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Website URL</span><strong style="font-size: 12px; color: #F1F5F9; word-break: break-all;">${escapeHtml(audit.config.url)}</strong></div>
      <div><span style="font-size: 9px; color: #94A3B8; text-transform: uppercase; display: block; font-weight: 700;">Target Geography</span><strong style="font-size: 12px; color: #F1F5F9;">${displayLocationHtml}</strong></div>
    </div>

    <!-- STATUS BANNER -->
    <div style="background: ${sales.isParkedOrIncomplete ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; border: 1px solid ${sales.isParkedOrIncomplete ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; padding: 10px 14px; border-radius: 6px;">
      <div style="font-size: 10px; font-weight: bold; color: ${sales.isParkedOrIncomplete ? '#FCA5A5' : '#86EFAC'}; text-transform: uppercase; margin-bottom: 2px;">
        ${sales.isParkedOrIncomplete ? '⚠️ Current Status: Holding / Under Construction Domain' : '✅ Current Status: Live Web Presence'}
      </div>
      <p style="font-size: 10.5px; color: #E2E8F0; line-height: 1.4;">${escapeHtml(sales.websiteStatusSummary)}</p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 1: SNAPSHOT & WHAT IS WORKING -->
  <div style="padding: 10px 0;">
    <h2 class="section-title">1. Website Visual Snapshot & Validated Strengths</h2>

    ${
      desktopImg || mobileImg
        ? `
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; align-items: flex-start; margin-bottom: 14px;">
      ${desktopImg ? `<div class="card" style="padding: 6px; text-align: center;"><img src="${desktopImg}" style="width: 100%; max-height: 240px; object-fit: contain; border-radius: 4px;" /><div style="font-size: 9.5px; font-weight: bold; color: #64748B; margin-top: 4px;">Desktop Viewport (1440x900)</div></div>` : ''}
      ${mobileImg ? `<div class="card" style="padding: 6px; text-align: center;"><img src="${mobileImg}" style="width: 100%; max-height: 240px; object-fit: contain; border-radius: 4px;" /><div style="font-size: 9.5px; font-weight: bold; color: #64748B; margin-top: 4px;">Mobile (390x844)</div></div>` : ''}
    </div>
    `
        : ''
    }

    <h3 style="font-size: 12px; font-weight: 700; color: #0F172A; margin: 10px 0 6px 0;">What Is Currently Working (Verified Signals)</h3>
    ${workingHtml}
  </div>

  <div class="page-break"></div>

  <!-- SECTION 2: TOP OPPORTUNITIES -->
  <div style="padding: 10px 0;">
    <h2 class="section-title">2. Top High-Impact Commercial Opportunities</h2>
    <p style="color: #475569; margin-bottom: 10px; font-size: 11px;">The most impactful improvements selected from audit evidence to accelerate customer inquiries and trust.</p>
    ${opportunitiesHtml}
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: STRUCTURE, ROADMAP & NEXT STEPS -->
  <div style="padding: 10px 0;">
    <h2 class="section-title">3. Recommended Website Structure & Implementation Plan</h2>
    
    <div class="card" style="margin-bottom: 12px; background: #F8FAFC;">
      <strong style="font-size: 11.5px; color: #0F172A; display: block; margin-bottom: 3px;">Why These Improvements Matter</strong>
      <p style="font-size: 10.5px; color: #475569; line-height: 1.4;">${escapeHtml(sales.whyTheseMatter)}</p>
    </div>

    <h3 style="font-size: 12px; font-weight: 700; color: #0F172A; margin: 10px 0 6px 0;">Recommended 5-Page Website Blueprint (${escapeHtml(sales.industry)})</h3>
    ${structureHtml}

    <h3 style="font-size: 12px; font-weight: 700; color: #0F172A; margin: 12px 0 6px 0;">Implementation Roadmap</h3>
    ${roadmapHtml}

    <!-- SHA WEBSTUDIO CONSULTATIVE CTA -->
    <div style="margin-top: 14px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFF; padding: 14px; border-radius: 8px; border: 1px solid #38BDF8;">
      <div style="font-size: 9px; font-weight: 800; color: #38BDF8; letter-spacing: 1.5px; text-transform: uppercase;">SHA WebStudio • Client Partnership</div>
      <h4 style="font-size: 13px; font-weight: 700; color: #F8FAFC; margin: 4px 0;">${escapeHtml(sales.agencyCta.title)}</h4>
      <p style="font-size: 10.5px; color: #CBD5E1; margin-bottom: 8px; line-height: 1.4;">${escapeHtml(sales.agencyCta.message)}</p>
      <div style="font-size: 10.5px; font-weight: 700; color: #38BDF8;">👉 ${escapeHtml(sales.agencyCta.contactPrompt)}</div>
    </div>
  </div>

  <div style="text-align: center; font-size: 9px; color: #94A3B8; margin-top: 18px; border-top: 1px solid #E2E8F0; padding-top: 8px;">
    SHA Website Auditor • Produced by SHA WebStudio • Confidential Client Delivery
  </div>
</body>
</html>
    `;
  }
}

