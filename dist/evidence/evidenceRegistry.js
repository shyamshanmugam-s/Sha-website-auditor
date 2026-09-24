"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceRegistry = void 0;
class EvidenceRegistry {
    evidenceList = [];
    counter = 0;
    /**
     * Register a new atomic piece of technical or visual evidence.
     */
    register(params) {
        this.counter += 1;
        const id = `E-${this.counter.toString().padStart(3, '0')}`;
        const record = {
            id,
            type: params.type,
            category: params.category,
            pageUrl: params.pageUrl,
            timestamp: new Date().toISOString(),
            status: params.status,
            description: params.description,
            metricValue: params.metricValue ?? null,
            rawSnippet: params.rawSnippet ?? null,
            data: params.data ?? {},
        };
        this.evidenceList.push(record);
        return record;
    }
    /**
     * Get all registered evidence items.
     */
    getAll() {
        return [...this.evidenceList];
    }
    /**
     * Find evidence by ID.
     */
    getById(id) {
        return this.evidenceList.find((e) => e.id === id);
    }
    /**
     * Get evidence list by category.
     */
    getByCategory(category) {
        return this.evidenceList.filter((e) => e.category === category);
    }
    /**
     * Get evidence list for a specific page.
     */
    getByPage(pageUrl) {
        return this.evidenceList.filter((e) => e.pageUrl === pageUrl);
    }
}
exports.EvidenceRegistry = EvidenceRegistry;
