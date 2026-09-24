"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditStore = exports.FileAuditStore = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_js_1 = require("../config.js");
class FileAuditStore {
    inMemoryCache = new Map();
    initialized = false;
    async ensureDirs() {
        if (this.initialized)
            return;
        await promises_1.default.mkdir(config_js_1.CONFIG.DATA_DIR, { recursive: true });
        await promises_1.default.mkdir(config_js_1.CONFIG.AUDITS_DIR, { recursive: true });
        await promises_1.default.mkdir(config_js_1.CONFIG.SCREENSHOTS_DIR, { recursive: true });
        await promises_1.default.mkdir(config_js_1.CONFIG.PDFS_DIR, { recursive: true });
        this.initialized = true;
    }
    async save(audit) {
        await this.ensureDirs();
        this.inMemoryCache.set(audit.id, audit);
        const filePath = path_1.default.join(config_js_1.CONFIG.AUDITS_DIR, `${audit.id}.json`);
        await promises_1.default.writeFile(filePath, JSON.stringify(audit, null, 2), 'utf-8');
    }
    async get(id) {
        if (this.inMemoryCache.has(id)) {
            return this.inMemoryCache.get(id);
        }
        await this.ensureDirs();
        const filePath = path_1.default.join(config_js_1.CONFIG.AUDITS_DIR, `${id}.json`);
        try {
            const data = await promises_1.default.readFile(filePath, 'utf-8');
            const audit = JSON.parse(data);
            this.inMemoryCache.set(id, audit);
            return audit;
        }
        catch {
            return null;
        }
    }
    async list(limit = 50) {
        await this.ensureDirs();
        try {
            const files = await promises_1.default.readdir(config_js_1.CONFIG.AUDITS_DIR);
            const jsonFiles = files.filter((f) => f.endsWith('.json'));
            const summaries = [];
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
        }
        catch {
            return [];
        }
    }
    async delete(id) {
        await this.ensureDirs();
        this.inMemoryCache.delete(id);
        const filePath = path_1.default.join(config_js_1.CONFIG.AUDITS_DIR, `${id}.json`);
        try {
            await promises_1.default.unlink(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.FileAuditStore = FileAuditStore;
exports.auditStore = new FileAuditStore();
