import fs from 'fs/promises';
import path from 'path';
import { CONFIG } from '../config.js';
import { AuditJob, AuditSummaryItem } from '../types/audit.js';

export interface IAuditStore {
  save(audit: AuditJob): Promise<void>;
  get(id: string): Promise<AuditJob | null>;
  list(limit?: number): Promise<AuditSummaryItem[]>;
  delete(id: string): Promise<boolean>;
}

export class FileAuditStore implements IAuditStore {
  private inMemoryCache: Map<string, AuditJob> = new Map();
  private initialized = false;

  private async ensureDirs(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
    await fs.mkdir(CONFIG.AUDITS_DIR, { recursive: true });
    await fs.mkdir(CONFIG.SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(CONFIG.PDFS_DIR, { recursive: true });
    this.initialized = true;
  }

  public async save(audit: AuditJob): Promise<void> {
    await this.ensureDirs();
    this.inMemoryCache.set(audit.id, audit);

    const filePath = path.join(CONFIG.AUDITS_DIR, `${audit.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(audit, null, 2), 'utf-8');
  }

  public async get(id: string): Promise<AuditJob | null> {
    if (this.inMemoryCache.has(id)) {
      return this.inMemoryCache.get(id)!;
    }

    await this.ensureDirs();
    const filePath = path.join(CONFIG.AUDITS_DIR, `${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const audit: AuditJob = JSON.parse(data);
      this.inMemoryCache.set(id, audit);
      return audit;
    } catch {
      return null;
    }
  }

  public async list(limit: number = 50): Promise<AuditSummaryItem[]> {
    await this.ensureDirs();
    try {
      const files = await fs.readdir(CONFIG.AUDITS_DIR);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const summaries: AuditSummaryItem[] = [];

      for (const file of jsonFiles) {
        const id = file.replace('.json', '');
        const audit = await this.get(id);
        if (audit) {
          const findings = audit.findings || [];
          summaries.push({
            id: audit.id,
            url: audit.config.url,
            businessName: audit.config.businessName,
            location: audit.config.location,
            createdAt: audit.createdAt,
            completedAt: audit.completedAt,
            status: audit.status,
            totalPagesCrawled: audit.crawledPagesCount,
            findingsCount: {
              total: findings.length,
              critical: findings.filter((f) => f.priority === 'CRITICAL').length,
              high: findings.filter((f) => f.priority === 'HIGH').length,
              medium: findings.filter((f) => f.priority === 'MEDIUM').length,
              low: findings.filter((f) => f.priority === 'LOW').length,
            },
          });
        }
      }

      // Sort by creation date descending
      summaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return summaries.slice(0, limit);
    } catch {
      return [];
    }
  }

  public async delete(id: string): Promise<boolean> {
    await this.ensureDirs();
    this.inMemoryCache.delete(id);
    const filePath = path.join(CONFIG.AUDITS_DIR, `${id}.json`);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const auditStore = new FileAuditStore();
