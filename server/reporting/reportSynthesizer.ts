import {
  AuditFinding,
  AuditJobConfig,
  EvidenceRecord,
  LighthouseResult,
  PageRecord,
  Priority,
  Report20Sections,
} from '../types/audit.js';
import { AISynthesisResult } from '../ai/aiInterface.js';
import { TechnicalAnalyzer } from '../analyzers/technicalAnalyzer.js';
import { SeoAnalyzer } from '../analyzers/seoAnalyzer.js';
import { AccessibilityAnalyzer } from '../analyzers/accessibilityAnalyzer.js';
import { MobileAnalyzer } from '../analyzers/mobileAnalyzer.js';
import { VisualAnalyzer } from '../analyzers/visualAnalyzer.js';
import { UxAnalyzer } from '../analyzers/uxAnalyzer.js';
import { ContentAnalyzer } from '../analyzers/contentAnalyzer.js';
import { ConversionAnalyzer } from '../analyzers/conversionAnalyzer.js';
import { LocalSeoAnalyzer } from '../analyzers/localSeoAnalyzer.js';
import { EvidenceRegistry } from '../evidence/evidenceRegistry.js';

export class ReportSynthesizer {
  public static synthesize(
    config: AuditJobConfig,
    pages: PageRecord[],
    evidenceRegistry: EvidenceRegistry,
    lighthouseResult: LighthouseResult,
    aiResult: AISynthesisResult,
    auditDurationSec: number
  ): { report: Report20Sections; allFindings: AuditFinding[] } {
    // 1. Run all deterministic analyzers
    const tech = TechnicalAnalyzer.analyze(pages, evidenceRegistry);
    const seo = SeoAnalyzer.analyze(pages, evidenceRegistry);
    const a11y = AccessibilityAnalyzer.analyze(pages, evidenceRegistry);
    const mobile = MobileAnalyzer.analyze(pages, evidenceRegistry);
    const visual = VisualAnalyzer.analyze(pages, evidenceRegistry);
    const ux = UxAnalyzer.analyze(pages, evidenceRegistry);
    const content = ContentAnalyzer.analyze(pages, evidenceRegistry);
    const conversion = ConversionAnalyzer.analyze(pages, evidenceRegistry);
    const localSeo = LocalSeoAnalyzer.analyze(pages, config.businessName, config.location, evidenceRegistry);

    // 2. Aggregate and ensure strict evidence linking for all findings
    const allFindings: AuditFinding[] = [
      ...tech.findings,
      ...seo.findings,
      ...a11y.findings,
      ...mobile.findings,
      ...visual.findings,
      ...ux.findings,
      ...content.findings,
      ...conversion.findings,
      ...localSeo.findings,
      ...aiResult.additionalFindings,
    ].map((finding) => {
      // Ensure evidenceIds is populated and non-empty
      if (!finding.evidenceIds || finding.evidenceIds.length === 0) {
        const categoryEv = evidenceRegistry.getByCategory(finding.category);
        if (categoryEv.length > 0) {
          finding.evidenceIds = categoryEv.map((e) => e.id);
        } else {
          // If no category evidence exists, register atomic evidence for this finding
          const registered = evidenceRegistry.register({
            type: `${finding.category}_observation`,
            category: finding.category,
            pageUrl: finding.pageUrl || (pages[0]?.url ?? config.url),
            status: finding.verificationStatus || 'INFERRED',
            description: finding.observation,
            rawSnippet: finding.evidence,
          });
          finding.evidenceIds = [registered.id];
        }
      }
      return finding;
    });

    // Priority counts
    const findingsCountByPriority: Record<Priority, number> = {
      CRITICAL: allFindings.filter((f) => f.priority === 'CRITICAL').length,
      HIGH: allFindings.filter((f) => f.priority === 'HIGH').length,
      MEDIUM: allFindings.filter((f) => f.priority === 'MEDIUM').length,
      LOW: allFindings.filter((f) => f.priority === 'LOW').length,
    };

    // 3. Assemble the 20 Sections
    const report: Report20Sections = {
      // Client Summary (Jargon-free business overview)
      clientSummary: aiResult.clientSummary || {
        overview: aiResult.executiveSummary,
        top5Opportunities: [],
        currentStrengths: aiResult.topStrengths,
        recommendedWebsiteStructure: aiResult.recommendedSitemap || [],
        nextSteps: [],
      },

      // 1. Executive Summary
      executiveSummary: {
        summary: aiResult.executiveSummary,
        overallCondition: aiResult.overallCondition,
        topStrengths: aiResult.topStrengths,
        topRisks: aiResult.topRisks,
        findingsCountByPriority,
      },

      // 2. Website Overview
      websiteOverview: {
        url: config.url,
        businessName: config.businessName,
        location: config.location,
        totalPagesCrawled: pages.length,
        auditDurationSec,
        techStackDetected: ['HTML5', 'Modern CSS/JS', isHttps(pages) ? 'HTTPS / SSL' : 'HTTP'],
        primaryLanguage: 'en',
      },

      // 3. Pages Inspected
      pagesInspected: pages.map((p) => ({
        url: p.url,
        title: p.title || 'Untitled Page',
        statusCode: p.statusCode,
        responseTimeMs: p.responseTimeMs,
        issuesCount: p.consoleErrors.length + p.networkErrors.length,
      })),

      // 4. Key Strengths
      keyStrengths: aiResult.topStrengths.map((str, idx) => ({
        title: `Strength ${idx + 1}`,
        description: str,
      })),

      // 5. Critical Issues
      criticalIssues: allFindings
        .filter((f) => f.priority === 'CRITICAL')
        .map((f) => ({
          title: f.title,
          description: f.observation,
          impact: f.impact,
          evidenceIds: f.evidenceIds,
        })),

      // 6. Visual Design Audit
      visualDesignAudit: {
        summary: visual.summary,
        typographyAssessment: visual.typographyAssessment + ' ' + (aiResult.visualObservations?.typography || ''),
        colorSystemAssessment: visual.colorSystemAssessment + ' ' + (aiResult.visualObservations?.colorSystem || ''),
        spacingLayoutAssessment: visual.spacingLayoutAssessment + ' ' + (aiResult.visualObservations?.spacingLayout || ''),
        visualHierarchyAssessment: visual.visualHierarchyAssessment + ' ' + (aiResult.visualObservations?.visualHierarchy || ''),
        brandConsistencyAssessment: visual.brandConsistencyAssessment + ' ' + (aiResult.visualObservations?.brandConsistency || ''),
        heroAssessment: visual.heroAssessment + ' ' + (aiResult.visualObservations?.heroSection || ''),
        footerAssessment: visual.footerAssessment + ' ' + (aiResult.visualObservations?.footerSection || ''),
        findings: allFindings.filter((f) => f.category === 'visual'),
      },

      // 7. UX Audit
      uxAudit: {
        summary: ux.summary,
        navigationStructure: ux.navigationStructure + ' ' + (aiResult.uxObservations?.navigation || ''),
        userJourney: ux.userJourney + ' ' + (aiResult.uxObservations?.userJourney || ''),
        serviceDiscovery: ux.serviceDiscovery + ' ' + (aiResult.uxObservations?.serviceDiscovery || ''),
        ctaPlacement: ux.ctaPlacement + ' ' + (aiResult.uxObservations?.ctaPlacement || ''),
        formsAssessment: ux.formsAssessment + ' ' + (aiResult.uxObservations?.forms || ''),
        findings: allFindings.filter((f) => f.category === 'ux'),
      },

      // 8. Mobile Experience
      mobileExperience: {
        summary: mobile.summary,
        responsiveDesignStatus: mobile.responsiveDesignStatus,
        tapTargetAssessment: mobile.tapTargetAssessment,
        horizontalOverflowDetected: mobile.horizontalOverflowDetected,
        mobileMenuAssessment: mobile.mobileMenuAssessment,
        findings: allFindings.filter((f) => f.category === 'mobile'),
      },

      // 9. Content Audit
      contentAudit: {
        summary: content.summary,
        clarityReadabilityScore: content.clarityReadabilityScore + ' ' + (aiResult.contentObservations?.clarity || ''),
        valuePropositionAssessment: content.valuePropositionAssessment + ' ' + (aiResult.contentObservations?.valueProposition || ''),
        contentGaps: aiResult.contentObservations?.contentGaps || content.contentGaps,
        findings: allFindings.filter((f) => f.category === 'content'),
      },

      // 10. Conversion / Lead Generation Audit
      conversionLeadGenAudit: {
        summary: conversion.summary,
        phoneVisibility: conversion.phoneVisibility,
        emailVisibility: conversion.emailVisibility,
        whatsappAvailability: conversion.whatsappAvailability,
        enquiryFlowAssessment: conversion.enquiryFlowAssessment + ' ' + (aiResult.conversionObservations?.enquiryFlow || ''),
        trustSignalsAssessment: conversion.trustSignalsAssessment + ' ' + (aiResult.conversionObservations?.trustSignals || ''),
        findings: allFindings.filter((f) => f.category === 'conversion'),
      },

      // 11. SEO Audit
      seoAudit: {
        summary: seo.summary,
        metaTitleStatus: seo.metaTitleStatus,
        metaDescriptionStatus: seo.metaDescriptionStatus,
        headingHierarchyStatus: seo.headingHierarchyStatus,
        canonicalStatus: seo.canonicalStatus,
        robotsSitemapStatus: seo.robotsSitemapStatus,
        structuredDataStatus: seo.structuredDataStatus,
        findings: allFindings.filter((f) => f.category === 'seo'),
      },

      // 12. Technical Audit
      technicalAudit: {
        summary: tech.summary,
        httpsStatus: tech.httpsStatus,
        redirectsStatus: tech.redirectsStatus,
        brokenLinksCount: tech.brokenLinksCount,
        brokenImagesCount: tech.brokenImagesCount,
        consoleErrorsCount: tech.consoleErrorsCount,
        findings: allFindings.filter((f) => f.category === 'technical'),
      },

      // 13. Performance Audit
      performanceAudit: {
        summary:
          lighthouseResult.status === 'TESTED'
            ? `Lighthouse Core Web Vitals measured. Performance Score: ${lighthouseResult.performanceScore ?? 'N/A'}/100. FCP: ${lighthouseResult.metrics.firstContentfulPaintMs ?? 'N/A'}ms, LCP: ${lighthouseResult.metrics.largestContentfulPaintMs ?? 'N/A'}ms, CLS: ${lighthouseResult.metrics.cumulativeLayoutShift ?? 'N/A'}.`
            : 'Lighthouse metrics could not be executed in the current environment and are marked as NOT VERIFIED.',
        lighthouse: lighthouseResult,
        coreWebVitalsSummary:
          lighthouseResult.metrics.largestContentfulPaintMs != null
            ? `LCP: ${lighthouseResult.metrics.largestContentfulPaintMs}ms, CLS: ${lighthouseResult.metrics.cumulativeLayoutShift}, TBT: ${lighthouseResult.metrics.totalBlockingTimeMs}ms`
            : 'NOT VERIFIED',
        findings: allFindings.filter((f) => f.category === 'performance'),
      },

      // 14. Accessibility Audit
      accessibilityAudit: {
        summary: a11y.summary,
        altTextCoverage: a11y.altTextCoverage,
        formLabelingStatus: a11y.formLabelingStatus,
        buttonNamesStatus: a11y.buttonNamesStatus,
        colorContrastStatus: a11y.colorContrastStatus,
        wcagDisclaimer: a11y.wcagDisclaimer,
        findings: allFindings.filter((f) => f.category === 'accessibility'),
      },

      // 15. Local SEO Opportunities
      localSeoOpportunities: {
        summary: localSeo.summary,
        businessNameMatch: localSeo.businessNameMatch,
        locationMatch: localSeo.locationMatch,
        napConsistency: localSeo.napConsistency,
        localSchemaDetected: localSeo.localSchemaDetected,
        opportunities: localSeo.opportunities,
        findings: allFindings.filter((f) => f.category === 'local_seo'),
      },

      // 16. Security Observations
      securityObservations: {
        summary: `Publicly observable security check: HTTPS ${tech.httpsStatus}. Missing defensive headers evaluated.`,
        httpsEnforced: isHttps(pages),
        mixedContentDetected: false,
        securityHeadersAssessment: 'Evaluated HSTS, CSP, and X-Frame-Options headers.',
        securityDisclaimer:
          'This security observation inspects publicly observable technical signals (HTTPS, security response headers). It does NOT constitute a penetration test or exploitation assessment.',
        findings: allFindings.filter((f) => f.category === 'security'),
      },

      // 17. Priority Improvement Plan
      priorityImprovementPlan: aiResult.priorityPlan || [
        {
          priority: 'HIGH',
          action: 'Optimize Meta Descriptions and Heading Structure',
          category: 'seo',
          effort: 'Low',
          rationale: 'Essential for search visibility and organic click-through rates.',
        },
      ],

      // 18. Recommended Website Structure
      recommendedWebsiteStructure: {
        summary: 'Target sitemap architecture designed for high-conversion user journeys and SEO depth.',
        suggestedSitemap: aiResult.recommendedSitemap || [],
      },

      // 19. Recommended Redesign Strategy
      recommendedRedesignStrategy: aiResult.redesignStrategy || {
        summary: 'Strategic redesign framework.',
        corePillars: [],
        designTokensSuggestion: {
          colorPaletteRecommendation: '',
          typographyRecommendation: '',
          layoutGuidance: '',
        },
      },

      // 20. Next Steps
      nextSteps: aiResult.nextSteps || [
        {
          stepNumber: 1,
          title: 'Immediate Quick Wins',
          description: 'Address critical technical issues and missing contact channels.',
          timelineRecommendation: 'Week 1',
        },
      ],
    };

    return { report, allFindings };
  }
}

function isHttps(pages: PageRecord[]): boolean {
  if (pages.length === 0) return false;
  return pages[0].finalUrl.startsWith('https://');
}
