"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_rate_limit_1 = require("express-rate-limit");
const zod_1 = require("zod");
const config_js_1 = require("./config.js");
const ssrfGuard_js_1 = require("./security/ssrfGuard.js");
const auditRunner_js_1 = require("./jobs/auditRunner.js");
const auditStore_js_1 = require("./storage/auditStore.js");
const pdfGenerator_js_1 = require("./reporting/pdfGenerator.js");
const salesReportSynthesizer_js_1 = require("./reporting/salesReportSynthesizer.js");
const app = (0, express_1.default)();
// Security & Middlewares
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json({ limit: '5mb' }));
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // max 300 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);
// Static file serving for screenshots
app.use('/screenshots', express_1.default.static(config_js_1.CONFIG.SCREENSHOTS_DIR));
app.use('/pdfs', express_1.default.static(config_js_1.CONFIG.PDFS_DIR));
// Validation Schema
const CreateAuditSchema = zod_1.z.object({
    url: zod_1.z.string().url({ message: 'A valid HTTP/HTTPS URL is required' }),
    businessName: zod_1.z.string().max(100).optional(),
    location: zod_1.z.string().max(100).optional(),
    maxPages: zod_1.z.number().int().min(1).max(config_js_1.CONFIG.MAX_PAGES_LIMIT).optional(),
});
// 1. Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'SHA Website Auditor API',
        provider: config_js_1.CONFIG.AI_PROVIDER,
        geminiConfigured: !!config_js_1.CONFIG.GEMINI_API_KEY,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// 2. Start Audit
app.post('/api/audit', async (req, res) => {
    try {
        const parseResult = CreateAuditSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: 'Invalid input parameters',
                details: parseResult.error.format(),
            });
            return;
        }
        const { url, businessName, location, maxPages } = parseResult.data;
        // SSRF Pre-flight Validation
        const ssrf = await (0, ssrfGuard_js_1.validateUrlForSSRF)(url);
        if (!ssrf.allowed) {
            res.status(400).json({
                error: 'Target URL is not permitted for security reasons.',
                reason: ssrf.reason,
            });
            return;
        }
        const job = await auditRunner_js_1.auditRunner.createAndRunJob({
            url: ssrf.normalizedUrl || url,
            businessName,
            location,
            maxPages: maxPages || config_js_1.CONFIG.MAX_PAGES_DEFAULT,
        });
        res.status(202).json({
            auditId: job.id,
            status: job.status,
            message: 'Audit job started successfully',
            streamUrl: `/api/audit/${job.id}/stream`,
        });
    }
    catch (err) {
        res.status(500).json({
            error: 'Failed to initialize audit job',
            message: err.message,
        });
    }
});
// 3. SSE Stream for Real-time Progress
app.get('/api/audit/:id/stream', async (req, res) => {
    const auditId = String(req.params.id);
    const audit = await auditRunner_js_1.auditRunner.getJob(auditId);
    if (!audit) {
        res.status(404).json({ error: 'Audit job not found' });
        return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // Send initial state
    res.write(`data: ${JSON.stringify({
        type: 'status',
        auditId: audit.id,
        status: audit.status,
        progressPercent: audit.progressPercent,
        message: audit.currentStepMessage,
    })}\n\n`);
    // If already completed or failed, close stream
    if (audit.status === 'completed' || audit.status === 'failed' || audit.status === 'cancelled') {
        res.write(`data: ${JSON.stringify({ type: audit.status === 'completed' ? 'complete' : 'error', auditId: audit.id, message: audit.currentStepMessage })}\n\n`);
        res.end();
        return;
    }
    const listener = (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === 'complete' || event.type === 'error' || event.status === 'cancelled') {
            auditRunner_js_1.auditRunner.off(`audit:${auditId}`, listener);
            res.end();
        }
    };
    auditRunner_js_1.auditRunner.on(`audit:${auditId}`, listener);
    req.on('close', () => {
        auditRunner_js_1.auditRunner.off(`audit:${auditId}`, listener);
    });
});
// 4. Cancel Audit
app.post('/api/audit/:id/cancel', async (req, res) => {
    const auditId = String(req.params.id);
    const success = await auditRunner_js_1.auditRunner.cancelJob(auditId);
    if (!success) {
        res.status(400).json({ error: 'Could not cancel audit (either not found or already finished).' });
        return;
    }
    res.json({ message: 'Audit cancelled successfully' });
});
// 5. Get Complete Audit Details
app.get('/api/audit/:id', async (req, res) => {
    const auditId = String(req.params.id);
    const audit = await auditRunner_js_1.auditRunner.getJob(auditId);
    if (!audit) {
        res.status(404).json({ error: 'Audit job not found' });
        return;
    }
    res.json(audit);
});
// 6. Download PDF Report (Client-Facing & Internal Technical Modes)
app.get('/api/audit/:id/pdf', async (req, res) => {
    const auditId = String(req.params.id);
    const mode = req.query.mode === 'internal' ? 'internal' : 'client';
    const audit = await auditRunner_js_1.auditRunner.getJob(auditId);
    if (!audit) {
        res.status(404).json({ error: 'Audit not found' });
        return;
    }
    let targetPdfPath = mode === 'internal' ? audit.internalPdfPath : (audit.clientPdfPath || audit.pdfPath);
    if (!targetPdfPath || !fs_1.default.existsSync(targetPdfPath)) {
        try {
            targetPdfPath = await pdfGenerator_js_1.PdfGenerator.generate(audit, mode);
            if (mode === 'internal') {
                audit.internalPdfPath = targetPdfPath;
            }
            else {
                audit.clientPdfPath = targetPdfPath;
                audit.pdfPath = targetPdfPath;
            }
            await auditStore_js_1.auditStore.save(audit);
        }
        catch (pdfErr) {
            res.status(500).json({ error: `Failed to generate ${mode} PDF report: ${pdfErr.message}` });
            return;
        }
    }
    res.setHeader('Content-Type', 'application/pdf');
    const filename = mode === 'internal'
        ? `SHA-Internal-Audit-${audit.config.businessName || 'Report'}-${audit.id.slice(0, 8)}.pdf`
        : `SHA-Client-Report-${audit.config.businessName || 'Report'}-${audit.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs_1.default.createReadStream(targetPdfPath).pipe(res);
});
// 7. Get Client Sales Report (JSON)
app.get('/api/audit/:id/sales-report', async (req, res) => {
    const auditId = String(req.params.id);
    const audit = await auditRunner_js_1.auditRunner.getJob(auditId);
    if (!audit) {
        res.status(404).json({ error: 'Audit job not found' });
        return;
    }
    if (!audit.salesReport) {
        audit.salesReport = salesReportSynthesizer_js_1.SalesReportSynthesizer.synthesize(audit);
        await auditStore_js_1.auditStore.save(audit);
    }
    res.json(audit.salesReport);
});
// 8. Download Client Sales PDF Report
app.get('/api/audit/:id/sales-pdf', async (req, res) => {
    const auditId = String(req.params.id);
    const audit = await auditRunner_js_1.auditRunner.getJob(auditId);
    if (!audit) {
        res.status(404).json({ error: 'Audit not found' });
        return;
    }
    if (!audit.salesReport) {
        audit.salesReport = salesReportSynthesizer_js_1.SalesReportSynthesizer.synthesize(audit);
    }
    let targetPdfPath = audit.salesPdfPath;
    if (!targetPdfPath || !fs_1.default.existsSync(targetPdfPath)) {
        try {
            targetPdfPath = await pdfGenerator_js_1.PdfGenerator.generate(audit, 'sales');
            audit.salesPdfPath = targetPdfPath;
            await auditStore_js_1.auditStore.save(audit);
        }
        catch (pdfErr) {
            res.status(500).json({ error: `Failed to generate Sales PDF report: ${pdfErr.message}` });
            return;
        }
    }
    res.setHeader('Content-Type', 'application/pdf');
    const filename = `SHA-Sales-Audit-${audit.config.businessName || 'Report'}-${audit.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs_1.default.createReadStream(targetPdfPath).pipe(res);
});
// 7. List Audits History
app.get('/api/audits', async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const summaries = await auditStore_js_1.auditStore.list(limit);
    res.json(summaries);
});
// 8. Delete Audit
app.delete('/api/audit/:id', async (req, res) => {
    const auditId = String(req.params.id);
    const success = await auditStore_js_1.auditStore.delete(auditId);
    res.json({ success });
});
// Serve frontend in production build
const clientDistPath = path_1.default.resolve(process.cwd(), 'client', 'dist');
if (fs_1.default.existsSync(clientDistPath)) {
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
// Start Server
const PORT = config_js_1.CONFIG.PORT;
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SHA Website Auditor Server running on port ${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
