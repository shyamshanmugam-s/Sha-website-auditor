import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { CONFIG } from './config.js';
import { validateUrlForSSRF } from './security/ssrfGuard.js';
import { auditRunner, AuditStreamEvent } from './jobs/auditRunner.js';
import { auditStore } from './storage/auditStore.js';
import { PdfGenerator } from './reporting/pdfGenerator.js';
import { SalesReportSynthesizer } from './reporting/salesReportSynthesizer.js';

const app = express();

// Security & Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Static file serving for screenshots
app.use('/screenshots', express.static(CONFIG.SCREENSHOTS_DIR));
app.use('/pdfs', express.static(CONFIG.PDFS_DIR));

// Validation Schema
const CreateAuditSchema = z.object({
  url: z.string().url({ message: 'A valid HTTP/HTTPS URL is required' }),
  businessName: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  maxPages: z.number().int().min(1).max(CONFIG.MAX_PAGES_LIMIT).optional(),
});

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'SHA Website Auditor API',
    provider: CONFIG.AI_PROVIDER,
    geminiConfigured: !!CONFIG.GEMINI_API_KEY,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 2. Start Audit
app.post('/api/audit', async (req: Request, res: Response): Promise<void> => {
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
    const ssrf = await validateUrlForSSRF(url);
    if (!ssrf.allowed) {
      res.status(400).json({
        error: 'Target URL is not permitted for security reasons.',
        reason: ssrf.reason,
      });
      return;
    }

    const job = await auditRunner.createAndRunJob({
      url: ssrf.normalizedUrl || url,
      businessName,
      location,
      maxPages: maxPages || CONFIG.MAX_PAGES_DEFAULT,
    });

    res.status(202).json({
      auditId: job.id,
      status: job.status,
      message: 'Audit job started successfully',
      streamUrl: `/api/audit/${job.id}/stream`,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to initialize audit job',
      message: err.message,
    });
  }
});

// 3. SSE Stream for Real-time Progress
app.get('/api/audit/:id/stream', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const audit = await auditRunner.getJob(auditId);

  if (!audit) {
    res.status(404).json({ error: 'Audit job not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state
  res.write(
    `data: ${JSON.stringify({
      type: 'status',
      auditId: audit.id,
      status: audit.status,
      progressPercent: audit.progressPercent,
      message: audit.currentStepMessage,
    })}\n\n`
  );

  // If already completed or failed, close stream
  if (audit.status === 'completed' || audit.status === 'failed' || audit.status === 'cancelled') {
    res.write(`data: ${JSON.stringify({ type: audit.status === 'completed' ? 'complete' : 'error', auditId: audit.id, message: audit.currentStepMessage })}\n\n`);
    res.end();
    return;
  }

  const listener = (event: AuditStreamEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (event.type === 'complete' || event.type === 'error' || event.status === 'cancelled') {
      auditRunner.off(`audit:${auditId}`, listener);
      res.end();
    }
  };

  auditRunner.on(`audit:${auditId}`, listener);

  req.on('close', () => {
    auditRunner.off(`audit:${auditId}`, listener);
  });
});

// 4. Cancel Audit
app.post('/api/audit/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const success = await auditRunner.cancelJob(auditId);
  if (!success) {
    res.status(400).json({ error: 'Could not cancel audit (either not found or already finished).' });
    return;
  }
  res.json({ message: 'Audit cancelled successfully' });
});

// 5. Get Complete Audit Details
app.get('/api/audit/:id', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const audit = await auditRunner.getJob(auditId);

  if (!audit) {
    res.status(404).json({ error: 'Audit job not found' });
    return;
  }

  res.json(audit);
});

// 6. Download PDF Report (Client-Facing & Internal Technical Modes)
app.get('/api/audit/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const mode = (req.query.mode as string) === 'internal' ? 'internal' : 'client';
  const audit = await auditRunner.getJob(auditId);

  if (!audit) {
    res.status(404).json({ error: 'Audit not found' });
    return;
  }

  let targetPdfPath = mode === 'internal' ? audit.internalPdfPath : (audit.clientPdfPath || audit.pdfPath);

  if (!targetPdfPath || !fs.existsSync(targetPdfPath)) {
    try {
      targetPdfPath = await PdfGenerator.generate(audit, mode);
      if (mode === 'internal') {
        audit.internalPdfPath = targetPdfPath;
      } else {
        audit.clientPdfPath = targetPdfPath;
        audit.pdfPath = targetPdfPath;
      }
      await auditStore.save(audit);
    } catch (pdfErr: any) {
      res.status(500).json({ error: `Failed to generate ${mode} PDF report: ${pdfErr.message}` });
      return;
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  const filename = mode === 'internal'
    ? `SHA-Internal-Audit-${audit.config.businessName || 'Report'}-${audit.id.slice(0, 8)}.pdf`
    : `SHA-Client-Report-${audit.config.businessName || 'Report'}-${audit.id.slice(0, 8)}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(targetPdfPath).pipe(res);
});

// 7. Get Client Sales Report (JSON)
app.get('/api/audit/:id/sales-report', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const audit = await auditRunner.getJob(auditId);

  if (!audit) {
    res.status(404).json({ error: 'Audit job not found' });
    return;
  }

  if (!audit.salesReport) {
    audit.salesReport = SalesReportSynthesizer.synthesize(audit);
    await auditStore.save(audit);
  }

  res.json(audit.salesReport);
});

// 8. Download Client Sales PDF Report
app.get('/api/audit/:id/sales-pdf', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const audit = await auditRunner.getJob(auditId);

  if (!audit) {
    res.status(404).json({ error: 'Audit not found' });
    return;
  }

  if (!audit.salesReport) {
    audit.salesReport = SalesReportSynthesizer.synthesize(audit);
  }

  let targetPdfPath = audit.salesPdfPath;

  if (!targetPdfPath || !fs.existsSync(targetPdfPath)) {
    try {
      targetPdfPath = await PdfGenerator.generate(audit, 'sales');
      audit.salesPdfPath = targetPdfPath;
      await auditStore.save(audit);
    } catch (pdfErr: any) {
      res.status(500).json({ error: `Failed to generate Sales PDF report: ${pdfErr.message}` });
      return;
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  const filename = `SHA-Sales-Audit-${audit.config.businessName || 'Report'}-${audit.id.slice(0, 8)}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(targetPdfPath).pipe(res);
});

// 7. List Audits History
app.get('/api/audits', async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const summaries = await auditStore.list(limit);
  res.json(summaries);
});

// 8. Delete Audit
app.delete('/api/audit/:id', async (req: Request, res: Response): Promise<void> => {
  const auditId = String(req.params.id);
  const success = await auditStore.delete(auditId);
  res.json({ success });
});

// Serve frontend in production build
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server
const PORT = CONFIG.PORT;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SHA Website Auditor Server running on port ${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
