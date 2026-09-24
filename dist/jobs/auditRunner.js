"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRunner = exports.AuditRunner = void 0;
const uuid_1 = require("uuid");
const events_1 = require("events");
const evidenceRegistry_js_1 = require("../evidence/evidenceRegistry.js");
const crawlerEngine_js_1 = require("../crawler/crawlerEngine.js");
const lighthouseRunner_js_1 = require("../analyzers/lighthouseRunner.js");
const providerFactory_js_1 = require("../ai/providerFactory.js");
const reportSynthesizer_js_1 = require("../reporting/reportSynthesizer.js");
const salesReportSynthesizer_js_1 = require("../reporting/salesReportSynthesizer.js");
const pdfGenerator_js_1 = require("../reporting/pdfGenerator.js");
const auditStore_js_1 = require("../storage/auditStore.js");
const config_js_1 = require("../config.js");
class AuditRunner extends events_1.EventEmitter {
    activeJobs = new Map();
    cancellationTokens = new Map();
    runningAuditsCount = 0;
    /**
     * Starts a new website audit job.
     */
    async createAndRunJob(config) {
        if (this.runningAuditsCount >= config_js_1.CONFIG.MAX_CONCURRENT_AUDITS) {
            throw new Error(`Server is currently processing maximum concurrent audits (${config_js_1.CONFIG.MAX_CONCURRENT_AUDITS}). Please try again shortly.`);
        }
        const auditId = (0, uuid_1.v4)();
        const audit = {
            id: auditId,
            config,
            status: 'queued',
            createdAt: new Date().toISOString(),
            progressPercent: 0,
            currentStepMessage: 'Audit initialized in queue...',
            crawledPagesCount: 0,
            totalPagesToCrawl: config.maxPages || config_js_1.CONFIG.MAX_PAGES_DEFAULT,
            pages: [],
            evidenceRegistry: [],
            findings: [],
        };
        this.activeJobs.set(auditId, audit);
        this.cancellationTokens.set(auditId, false);
        await auditStore_js_1.auditStore.save(audit);
        // Run asynchronously in the background
        this.executeAudit(auditId).catch((err) => {
            console.error(`Audit ${auditId} unhandled failure:`, err);
        });
        return audit;
    }
    /**
     * Cancels an ongoing audit job.
     */
    async cancelJob(auditId) {
        const audit = this.activeJobs.get(auditId);
        if (!audit)
            return false;
        if (audit.status === 'completed' || audit.status === 'failed' || audit.status === 'cancelled') {
            return false;
        }
        this.cancellationTokens.set(auditId, true);
        audit.status = 'cancelled';
        audit.currentStepMessage = 'Audit was cancelled by user.';
        audit.completedAt = new Date().toISOString();
        await auditStore_js_1.auditStore.save(audit);
        this.emitEvent(auditId, 'status', 0, 'Audit cancelled by user');
        return true;
    }
    /**
     * Retrieves active or stored audit job.
     */
    async getJob(auditId) {
        if (this.activeJobs.has(auditId)) {
            return this.activeJobs.get(auditId);
        }
        return await auditStore_js_1.auditStore.get(auditId);
    }
    /**
     * Main audit pipeline execution logic.
     */
    async executeAudit(auditId) {
        const audit = this.activeJobs.get(auditId);
        const startTime = Date.now();
        this.runningAuditsCount++;
        const isCancelled = () => !!this.cancellationTokens.get(auditId);
        // Timeout safety guard
        const timeoutId = setTimeout(() => {
            if (audit.status === 'crawling' || audit.status === 'analyzing' || audit.status === 'synthesizing') {
                this.cancellationTokens.set(auditId, true);
                this.failJob(audit, `Audit timed out after ${config_js_1.CONFIG.AUDIT_TIMEOUT_MS / 1000} seconds.`);
            }
        }, config_js_1.CONFIG.AUDIT_TIMEOUT_MS);
        try {
            audit.status = 'crawling';
            audit.startedAt = new Date().toISOString();
            this.updateProgress(audit, 5, `Starting crawler on ${audit.config.url}...`);
            const evidenceRegistry = new evidenceRegistry_js_1.EvidenceRegistry();
            // 1. CRAWLER PHASE
            const pages = await crawlerEngine_js_1.CrawlerEngine.crawl(audit.config.url, audit.id, evidenceRegistry, audit.config.maxPages || config_js_1.CONFIG.MAX_PAGES_DEFAULT, {
                onProgress: (percent, msg) => {
                    this.updateProgress(audit, percent, msg);
                },
                isCancelled,
            });
            if (isCancelled())
                return;
            audit.pages = pages;
            audit.crawledPagesCount = pages.length;
            if (pages.length === 0 || pages[0].statusCode === 0) {
                throw new Error(`Could not access website: ${pages[0]?.statusText || 'Connection refused or host unreachable'}`);
            }
            // 2. LIGHTHOUSE / PERFORMANCE PHASE
            audit.status = 'analyzing';
            this.updateProgress(audit, 70, 'Running Lighthouse Core Web Vitals & performance inspection...');
            const homePage = pages[0];
            const lighthouseResult = await lighthouseRunner_js_1.LighthouseRunner.run(homePage.url, evidenceRegistry);
            audit.lighthouse = lighthouseResult;
            if (isCancelled())
                return;
            // 3. AI SYNTHESIS PHASE
            audit.status = 'synthesizing';
            this.updateProgress(audit, 85, 'Synthesizing technical evidence and visual AI observations...');
            const aiProvider = providerFactory_js_1.AIProviderFactory.getProvider();
            const aiResult = await aiProvider.synthesize({
                url: audit.config.url,
                businessName: audit.config.businessName,
                location: audit.config.location,
                pages,
                evidence: evidenceRegistry.getAll(),
                desktopScreenshotPath: homePage.desktopScreenshot
                    ? `${config_js_1.CONFIG.DATA_DIR}${homePage.desktopScreenshot}`
                    : undefined,
                mobileScreenshotPath: homePage.mobileScreenshot
                    ? `${config_js_1.CONFIG.DATA_DIR}${homePage.mobileScreenshot}`
                    : undefined,
            });
            if (isCancelled())
                return;
            // 4. REPORT SYNTHESIS PHASE
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            const { report, allFindings } = reportSynthesizer_js_1.ReportSynthesizer.synthesize(audit.config, pages, evidenceRegistry, lighthouseResult, aiResult, durationSec);
            audit.report = report;
            audit.findings = allFindings;
            audit.evidenceRegistry = evidenceRegistry.getAll();
            audit.salesReport = salesReportSynthesizer_js_1.SalesReportSynthesizer.synthesize(audit);
            // 5. PDF GENERATION PHASE (Client-Facing, Internal Technical & Client Sales)
            this.updateProgress(audit, 95, 'Generating client, technical, and sales PDF reports...');
            try {
                const clientPdf = await pdfGenerator_js_1.PdfGenerator.generate(audit, 'client');
                const internalPdf = await pdfGenerator_js_1.PdfGenerator.generate(audit, 'internal');
                const salesPdf = await pdfGenerator_js_1.PdfGenerator.generate(audit, 'sales');
                audit.pdfPath = clientPdf;
                audit.clientPdfPath = clientPdf;
                audit.internalPdfPath = internalPdf;
                audit.salesPdfPath = salesPdf;
            }
            catch (pdfErr) {
                console.warn(`PDF generation notice: ${pdfErr.message}`);
            }
            // 6. COMPLETION
            audit.status = 'completed';
            audit.progressPercent = 100;
            audit.currentStepMessage = 'Audit completed successfully!';
            audit.completedAt = new Date().toISOString();
            await auditStore_js_1.auditStore.save(audit);
            this.emitEvent(auditId, 'complete', 100, 'Audit completed successfully!', {
                findingsCount: allFindings.length,
                durationSec,
            });
        }
        catch (err) {
            if (!isCancelled()) {
                this.failJob(audit, err.message || 'Audit failed unexpectedly.');
            }
        }
        finally {
            clearTimeout(timeoutId);
            this.runningAuditsCount = Math.max(0, this.runningAuditsCount - 1);
        }
    }
    updateProgress(audit, percent, message) {
        audit.progressPercent = percent;
        audit.currentStepMessage = message;
        this.emitEvent(audit.id, 'progress', percent, message);
    }
    async failJob(audit, errorMsg) {
        audit.status = 'failed';
        audit.error = errorMsg;
        audit.currentStepMessage = `Audit failed: ${errorMsg}`;
        audit.completedAt = new Date().toISOString();
        await auditStore_js_1.auditStore.save(audit);
        this.emitEvent(audit.id, 'error', audit.progressPercent, errorMsg);
    }
    emitEvent(auditId, type, progressPercent, message, data) {
        const event = {
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
exports.AuditRunner = AuditRunner;
exports.auditRunner = new AuditRunner();
