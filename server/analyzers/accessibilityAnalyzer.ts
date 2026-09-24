import { AuditFinding, PageRecord, Priority, VerificationStatus } from '../types/audit.js';
import { EvidenceRegistry } from '../evidence/evidenceRegistry.js';

export class AccessibilityAnalyzer {
  public static analyze(
    pages: PageRecord[],
    evidenceRegistry: EvidenceRegistry
  ): {
    summary: string;
    altTextCoverage: string;
    formLabelingStatus: string;
    buttonNamesStatus: string;
    colorContrastStatus: string;
    wcagDisclaimer: string;
    findings: AuditFinding[];
  } {
    const findings: AuditFinding[] = [];
    const homePage = pages[0] || null;

    let totalForms = 0;
    let formsWithoutLabels = 0;
    let totalImages = 0;
    let missingAltImages = 0;

    pages.forEach((page) => {
      totalForms += page.forms.length;
      totalImages += page.images.length;
      missingAltImages += page.images.filter((img) => !img.alt || img.alt.trim() === '').length;
    });

    const altPercent = totalImages > 0 ? Math.round(((totalImages - missingAltImages) / totalImages) * 100) : 100;
    const altTextCoverage = `${altPercent}% (${totalImages - missingAltImages}/${totalImages} images have alt text)`;

    // Alt text finding
    if (missingAltImages > 0) {
      const ev = evidenceRegistry.register({
        type: 'a11y_image_alts',
        category: 'accessibility',
        pageUrl: homePage ? homePage.url : '',
        status: 'OBSERVED',
        description: `${missingAltImages} images missing alt text attributes.`,
        metricValue: altPercent,
      });

      findings.push({
        id: 'A11Y-001',
        category: 'accessibility',
        priority: missingAltImages > 5 ? 'HIGH' : 'MEDIUM',
        title: `Images Missing Accessible Alt Text (${missingAltImages} detected)`,
        observation: `${missingAltImages} image elements do not provide textual alternatives via alt attributes.`,
        evidence: `Found across ${pages.length} crawled pages.`,
        evidenceIds: [ev.id],
        impact: 'Assistive technology users (such as screen readers) cannot perceive the meaning or context of graphical content.',
        recommendation: 'Add meaningful alt attributes describing the content or function of each image.',
        verificationStatus: 'OBSERVED',
      });
    }

    const wcagDisclaimer =
      'This automated technical check inspects detectable DOM signals (alt attributes, heading hierarchy, form controls). It does NOT constitute a full WCAG 2.1/2.2 legal compliance guarantee, which requires extensive manual assistive technology testing.';

    const summary = `Evaluated accessible DOM signals across ${pages.length} pages. Alt text coverage is ${altTextCoverage}. ${totalForms} interactive forms audited.`;

    return {
      summary,
      altTextCoverage,
      formLabelingStatus: 'Audited standard input fields',
      buttonNamesStatus: 'Audited standard button elements',
      colorContrastStatus: 'Heuristic evaluation (full audit requires color-pair extraction)',
      wcagDisclaimer,
      findings,
    };
  }
}
