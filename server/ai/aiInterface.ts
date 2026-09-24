import { AuditFinding, ClientSummary, EvidenceRecord, PageRecord, Priority, VerificationStatus } from '../types/audit.js';

export interface AISynthesisInput {
  url: string;
  businessName?: string;
  location?: string;
  pages: PageRecord[];
  evidence: EvidenceRecord[];
  desktopScreenshotPath?: string;
  mobileScreenshotPath?: string;
}

export interface AISynthesisResult {
  executiveSummary: string;
  overallCondition: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical Issues';
  topStrengths: string[];
  topRisks: string[];
  clientSummary: ClientSummary;
  visualObservations: {
    typography: string;
    colorSystem: string;
    spacingLayout: string;
    visualHierarchy: string;
    heroSection: string;
    footerSection: string;
    brandConsistency: string;
  };
  uxObservations: {
    navigation: string;
    userJourney: string;
    serviceDiscovery: string;
    ctaPlacement: string;
    forms: string;
  };
  contentObservations: {
    clarity: string;
    valueProposition: string;
    contentGaps: string[];
  };
  conversionObservations: {
    enquiryFlow: string;
    trustSignals: string;
  };
  additionalFindings: AuditFinding[];
  recommendedSitemap: Array<{
    pageName: string;
    slug: string;
    purpose: string;
    keySections: string[];
  }>;
  redesignStrategy: {
    summary: string;
    corePillars: Array<{ title: string; description: string }>;
    designTokensSuggestion: {
      colorPaletteRecommendation: string;
      typographyRecommendation: string;
      layoutGuidance: string;
    };
  };
  priorityPlan: Array<{
    priority: Priority;
    action: string;
    category: any;
    effort: 'Low' | 'Medium' | 'High';
    rationale: string;
  }>;
  nextSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    timelineRecommendation: string;
  }>;
}

export interface IAIProvider {
  readonly name: string;
  isAvailable(): boolean;
  synthesize(input: AISynthesisInput): Promise<AISynthesisResult>;
}
