import { EvidenceRecord, FindingCategory, VerificationStatus } from '../types/audit.js';

export class EvidenceRegistry {
  private evidenceList: EvidenceRecord[] = [];
  private counter: number = 0;

  /**
   * Register a new atomic piece of technical or visual evidence.
   */
  public register(params: {
    type: string;
    category: FindingCategory;
    pageUrl: string;
    status: VerificationStatus;
    description: string;
    metricValue?: string | number | null;
    rawSnippet?: string | null;
    data?: Record<string, any>;
  }): EvidenceRecord {
    this.counter += 1;
    const id = `E-${this.counter.toString().padStart(3, '0')}`;

    const record: EvidenceRecord = {
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
  public getAll(): EvidenceRecord[] {
    return [...this.evidenceList];
  }

  /**
   * Find evidence by ID.
   */
  public getById(id: string): EvidenceRecord | undefined {
    return this.evidenceList.find((e) => e.id === id);
  }

  /**
   * Get evidence list by category.
   */
  public getByCategory(category: FindingCategory): EvidenceRecord[] {
    return this.evidenceList.filter((e) => e.category === category);
  }

  /**
   * Get evidence list for a specific page.
   */
  public getByPage(pageUrl: string): EvidenceRecord[] {
    return this.evidenceList.filter((e) => e.pageUrl === pageUrl);
  }
}
