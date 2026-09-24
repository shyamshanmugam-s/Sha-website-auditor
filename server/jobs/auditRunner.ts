import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { AuditJob, AuditJobConfig, JobStatus } from '../types/audit.js';
import { EvidenceRegistry } from '../evidence/evidenceRegistry.js';
import { CrawlerEngine } from '../crawler/crawlerEngine.js';
import { LighthouseRunner } from '../analyzers/lighthouseRunner.js';
import { AIProviderFactory } from '../ai/providerFactory.js';
import { ReportSynthesizer } from '../reporting/reportSynthesizer.js';
import { SalesReportSynthesizer } from '../reporting/salesReportSynthesizer.js';
import { PdfGenerator } from '../reporting/pdfGenerator.js';
import { auditStore } from '../storage/auditStore.js';
import { CONFIG } from '../config.js';

export interface AuditStreamEvent {
  type: 'status' | 'progress' | 'page_crawled' | 'evidence_added' | 'complete' | 'error';
  auditId: string;
  status: JobStatus;
  progressPercent: number;
  message: string;
  data?: any;
}

export class AuditRunner extends EventEmitter {
  private activeJobs: Map<string, AuditJob> = new Map();
  private cancellationTokens: Map<string, boolean> = new Map();
  private runningAuditsCount = 0;

  /**
   * Starts a new website audit job.
   */
  public async createAndRunJob(config: AuditJobConfig): Promise<AuditJob> {
    if (this.runningAuditsCount >= CONFIG.MAX_CONCURRENT_AUDITS) {
      throw new Error(`Server is currently processing maximum concurrent audits (${CONFIG.MAX_CONCURRENT_AUDITS}). Please try again shortly.`);
    }

    const auditId = uuidv4();
    const audit: AuditJob = {
      id: auditId,
      config,
      status: 'queued',
      createdAt: new Date().toISOString(),
      progressPercent: 0,
      currentStepMessage: 'Audit initialized in queue...',
      crawledPagesCount: 0,
      totalPagesToCrawl: config.maxPages || CONFIG.MAX_PAGES_DEFAULT,
      pages: [],
      evidenceRegistry: [],
      findings: [],
    };

    this.activeJobs.set(auditId, audit);
    this.cancellationTokens.set(auditId, false);
    await auditStore.save(audit);

    // Run asynchronously in the background
    this.executeAudit(auditId).catch((err) => {
      console.error(`Audit ${auditId} unhandled failure:`, err);
    });

    return audit;
  }

  /**
   * Cancels an ongoing audit job.
   */
  public async cancelJob(auditId: string): Promise<boolean> {
    const audit = this.activeJobs.get(auditId);
    if (!audit) return false;

    if (audit.status === 'completed' || audit.status === 'failed' || audit.status === 'cancelled') {
      return false;
    }

    this.cancellationTokens.set(auditId, true);
    audit.status = 'cancelled';
    audit.currentStepMessage = 'Audit was cancelled by user.';
    audit.completedAt = new Date().toISOString();

    await auditStore.save(audit);
    this.emitEvent(auditId, 'status', 0, 'Audit cancelled by user');
    return true;
  }

  /**
   * Retrieves active or stored audit job.
   */
  public async getJob(auditId: string): Promise<AuditJob | null> {
    if (this.activeJobs.has(auditId)) {
      return this.activeJobs.get(auditId)!;
    }
    return await auditStore.get(auditId);
  }

  /**
   * Main audit pipeline execution logic.
   */
  private async executeAudit(auditId: string): Promise<void> {
    const audit = this.activeJobs.get(auditId)!;
    const startTime = Date.now();
    this.runningAuditsCount++;

    const isCancelled = () => !!this.cancellationTokens.get(auditId);

    // Timeout safety guard
    const timeoutId = setTimeout(() => {
      if (audit.status === 'crawling' || audit.status === 'analyzing' || audit.status === 'synthesizing') {
        this.cancellationTokens.set(auditId, true);
        this.failJob(audit, `Audit timed out after ${CONFIG.AUDIT_TIMEOUT_MS / 1000} seconds.`);
      }
    }, CONFIG.AUDIT_TIMEOUT_MS);

    try {
      audit.status = 'crawling';
      audit.startedAt = new Date().toISOString();
      this.updateProgress(audit, 5, `Starting crawler on ${audit.config.url}...`);

      const evidenceRegistry = new EvidenceRegistry();

      // 1. CRAWLER PHASE
      const pages = await CrawlerEngine.crawl(
        audit.config.url,
        audit.id,
        evidenceRegistry,
        audit.config.maxPages || CONFIG.MAX_PAGES_DEFAULT,
        {
          onProgress: (percent, msg) => {
            this.updateProgress(audit, percent, msg);
          },
          isCancelled,
        }
      );

      if (isCancelled()) return;

      audit.pages = pages;
      audit.crawledPagesCount = pages.length;

      if (pages.length === 0 || pages[0].statusCode === 0) {
        throw new Error(`Could not access website: ${pages[0]?.statusText || 'Connection refused or host unreachable'}`);
      }

      // 2. LIGHTHOUSE / PERFORMANCE PHASE
      audit.status = 'analyzing';
      this.updateProgress(audit, 70, 'Running Lighthouse Core Web Vitals & performance inspection...');

      const homePage = pages[0];
      const lighthouseResult = await LighthouseRunner.run(homePage.url, evidenceRegistry);
      audit.lighthouse = lighthouseResult;

      if (isCancelled()) return;

      // 3. AI SYNTHESIS PHASE
      audit.status = 'synthesizing';
      this.updateProgress(audit, 85, 'Synthesizing technical evidence and visual AI observations...');

      const aiProvider = AIProviderFactory.getProvider();
      const aiResult = await aiProvider.synthesize({
        url: audit.config.url,
        businessName: audit.config.businessName,
        location: audit.config.location,
        pages,
        evidence: evidenceRegistry.getAll(),
        desktopScreenshotPath: homePage.desktopScreenshot
          ? `${CONFIG.DATA_DIR}${homePage.desktopScreenshot}`
          : undefined,
        mobileScreenshotPath: homePage.mobileScreenshot
          ? `${CONFIG.DATA_DIR}${homePage.mobileScreenshot}`
          : undefined,
      });

      if (isCancelled()) return;

      // 4. REPORT SYNTHESIS PHASE
      const durationSec = Math.round((Date.now() - startTime) / 1000);
      const { report, allFindings } = ReportSynthesizer.synthesize(
        audit.config,
        pages,
        evidenceRegistry,
        lighthouseResult,
        aiResult,
        durationSec
      );

      audit.report = report;
      audit.findings = allFindings;
      audit.evidenceRegistry = evidenceRegistry.getAll();
      audit.salesReport = SalesReportSynthesizer.synthesize(audit);

      // 5. PDF GENERATION PHASE (Client-Facing, Internal Technical & Client Sales)
      this.updateProgress(audit, 95, 'Generating client, technical, and sales PDF reports...');
      try {
        const clientPdf = await PdfGenerator.generate(audit, 'client');
        const internalPdf = await PdfGenerator.generate(audit, 'internal');
        const salesPdf = await PdfGenerator.generate(audit, 'sales');
        audit.pdfPath = clientPdf;
        audit.clientPdfPath = clientPdf;
        audit.internalPdfPath = internalPdf;
        audit.salesPdfPath = salesPdf;
      } catch (pdfErr: any) {
        console.warn(`PDF generation notice: ${pdfErr.message}`);
      }

      // 6. COMPLETION
      audit.status = 'completed';
      audit.progressPercent = 100;
      audit.currentStepMessage = 'Audit completed successfully!';
      audit.completedAt = new Date().toISOString();

      await auditStore.save(audit);
      this.emitEvent(auditId, 'complete', 100, 'Audit completed successfully!', {
        findingsCount: allFindings.length,
        durationSec,
      });
    } catch (err: any) {
      if (!isCancelled()) {
        this.failJob(audit, err.message || 'Audit failed unexpectedly.');
      }
    } finally {
      clearTimeout(timeoutId);
      this.runningAuditsCount = Math.max(0, this.runningAuditsCount - 1);
    }
  }

  private updateProgress(audit: AuditJob, percent: number, message: string): void {
    audit.progressPercent = percent;
    audit.currentStepMessage = message;
    this.emitEvent(audit.id, 'progress', percent, message);
  }

  private async failJob(audit: AuditJob, errorMsg: string): Promise<void> {
    audit.status = 'failed';
    audit.error = errorMsg;
    audit.currentStepMessage = `Audit failed: ${errorMsg}`;
    audit.completedAt = new Date().toISOString();

    await auditStore.save(audit);
    this.emitEvent(audit.id, 'error', audit.progressPercent, errorMsg);
  }

  private emitEvent(
    auditId: string,
    type: AuditStreamEvent['type'],
    progressPercent: number,
    message: string,
    data?: any
  ): void {
    const event: AuditStreamEvent = {
      type,
      auditId,
      status: this.activeJobs.get(auditId)?.status || 'queued',
      progressPercent,
      message,
      data,
    };
    this.emit(`audit:${auditId}`, event);
  }
}

export const auditRunner = new AuditRunner();
