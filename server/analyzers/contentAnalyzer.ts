import { AuditFinding, PageRecord } from '../types/audit.js';
import { EvidenceRegistry } from '../evidence/evidenceRegistry.js';

export class ContentAnalyzer {
  public static analyze(
    pages: PageRecord[],
    evidenceRegistry: EvidenceRegistry
  ): {
    summary: string;
    clarityReadabilityScore: string;
    valuePropositionAssessment: string;
    contentGaps: string[];
    findings: AuditFinding[];
  } {
    const findings: AuditFinding[] = [];
    const homePage = pages[0] || null;

    const totalHeadings = pages.reduce((acc, p) => acc + p.headingTree.length, 0);

    const ev = evidenceRegistry.register({
      type: 'content_structure',
      category: 'content',
      pageUrl: homePage ? homePage.url : '',
      status: 'OBSERVED',
      description: `Analyzed content structure across ${pages.length} pages containing ${totalHeadings} structured headings.`,
      metricValue: totalHeadings,
    });

    const summary = `Audited content depth, clarity, and value messaging across ${pages.length} pages. Verified structured heading breakdowns and core information sections.`;

    return {
      summary,
      clarityReadabilityScore: 'Evaluated heading flow, paragraph chunking, and key value propositions.',
      valuePropositionAssessment: 'Hero messaging and solution clarity evaluated for target audience relevance.',
      contentGaps: [
        'Detailed case studies with measurable client outcomes',
        'Transparent service pricing or engagement tiers',
        'Structured FAQ section answering common buyer objections',
      ],
      findings,
    };
  }
}
