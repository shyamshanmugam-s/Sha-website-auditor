export type VerificationStatus = 
  | 'OBSERVED' 
  | 'TESTED' 
  | 'INFERRED' 
  | 'NOT VERIFIED' 
  | 'NOT APPLICABLE';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingCategory = 
  | 'visual'
  | 'ux'
  | 'mobile'
  | 'content'
  | 'conversion'
  | 'seo'
  | 'technical'
  | 'performance'
  | 'accessibility'
  | 'local_seo'
  | 'security'
  | 'strategy';

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  priority: Priority;
  title: string;
  observation: string;
  evidence: string;
  evidenceIds: string[];
  impact: string;
  recommendation: string;
  verificationStatus: VerificationStatus;
  pageUrl?: string;
  screenshotRef?: string;
}

export interface EvidenceRecord {
  id: string; // E-001, E-002, etc.
  type: string; // e.g. 'dom_check', 'http_header', 'network_error', 'console_log', 'lighthouse_metric', 'visual_screenshot', 'meta_tag', 'schema_jsonld'
  category: FindingCategory;
  pageUrl: string;
  timestamp: string;
  status: VerificationStatus;
  description: string;
  metricValue?: string | number | null;
  rawSnippet?: string | null;
  data?: Record<string, any>;
}

export interface PageRecord {
  url: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  contentType: string;
  responseTimeMs: number;
  title: string;
  metaDescription?: string;
  canonicalUrl?: string;
  h1s: string[];
  headingTree: { tag: string; text: string }[];
  desktopScreenshot?: string;
  mobileScreenshot?: string;
  consoleErrors: Array<{ text: string; location?: string }>;
  networkErrors: Array<{ url: string; status: number | string; statusText?: string }>;
  internalLinks: string[];
  externalLinks: string[];
  images: Array<{ src: string; alt: string; naturalWidth?: number; naturalHeight?: number }>;
  forms: Array<{ action: string; method: string; inputCount: number; hasEmail: boolean; hasPhone: boolean; hasSubmit: boolean }>;
  contactSignals: {
    phones: string[];
    emails: string[];
    whatsapps: string[];
  };
  securityHeaders: {
    hsts?: string | null;
    csp?: string | null;
    xFrameOptions?: string | null;
    xContentTypeOptions?: string | null;
    referrerPolicy?: string | null;
    permissionsPolicy?: string | null;
  };
  htmlLengthBytes: number;
  evidenceIds: string[];
}

export interface LighthouseResult {
  performanceScore: number | null; // 0-100 or null if not verified
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  metrics: {
    firstContentfulPaintMs: number | null;
    largestContentfulPaintMs: number | null;
    cumulativeLayoutShift: number | null;
    totalBlockingTimeMs: number | null;
    speedIndexMs: number | null;
    interactiveMs: number | null;
  };
  audits: Array<{
    id: string;
    title: string;
    description: string;
    score: number | null;
    displayValue?: string;
    details?: any;
  }>;
  status: VerificationStatus;
}

export interface ClientSummary {
  overview: string;
  top5Opportunities: Array<{
    title: string;
    businessImpact: string;
    recommendedAction: string;
  }>;
  currentStrengths: string[];
  recommendedWebsiteStructure: Array<{
    pageName: string;
    purpose: string;
    keySections: string[];
  }>;
  nextSteps: Array<{
    step: string;
    timeframe: string;
  }>;
}

export interface Report20Sections {
  clientSummary: ClientSummary;
  executiveSummary: {
    summary: string;
    overallCondition: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical Issues';
    topStrengths: string[];
    topRisks: string[];
    findingsCountByPriority: Record<Priority, number>;
  };
  websiteOverview: {
    url: string;
    businessName?: string;
    location?: string;
    totalPagesCrawled: number;
    auditDurationSec: number;
    techStackDetected: string[];
    primaryLanguage?: string;
  };
  pagesInspected: Array<{
    url: string;
    title: string;
    statusCode: number;
    responseTimeMs: number;
    issuesCount: number;
  }>;
  keyStrengths: Array<{
    title: string;
    description: string;
    evidenceId?: string;
  }>;
  criticalIssues: Array<{
    title: string;
    description: string;
    impact: string;
    evidenceIds: string[];
  }>;
  visualDesignAudit: {
    summary: string;
    typographyAssessment: string;
    colorSystemAssessment: string;
    spacingLayoutAssessment: string;
    visualHierarchyAssessment: string;
    brandConsistencyAssessment: string;
    heroAssessment: string;
    footerAssessment: string;
    findings: AuditFinding[];
  };
  uxAudit: {
    summary: string;
    navigationStructure: string;
    userJourney: string;
    serviceDiscovery: string;
    ctaPlacement: string;
    formsAssessment: string;
    findings: AuditFinding[];
  };
  mobileExperience: {
    summary: string;
    responsiveDesignStatus: VerificationStatus;
    tapTargetAssessment: string;
    horizontalOverflowDetected: boolean;
    mobileMenuAssessment: string;
    findings: AuditFinding[];
  };
  contentAudit: {
    summary: string;
    clarityReadabilityScore: string;
    valuePropositionAssessment: string;
    contentGaps: string[];
    findings: AuditFinding[];
  };
  conversionLeadGenAudit: {
    summary: string;
    phoneVisibility: string;
    emailVisibility: string;
    whatsappAvailability: string;
    enquiryFlowAssessment: string;
    trustSignalsAssessment: string;
    findings: AuditFinding[];
  };
  seoAudit: {
    summary: string;
    metaTitleStatus: string;
    metaDescriptionStatus: string;
    headingHierarchyStatus: string;
    canonicalStatus: string;
    robotsSitemapStatus: string;
    structuredDataStatus: string;
    findings: AuditFinding[];
  };
  technicalAudit: {
    summary: string;
    httpsStatus: string;
    redirectsStatus: string;
    brokenLinksCount: number;
    brokenImagesCount: number;
    consoleErrorsCount: number;
    findings: AuditFinding[];
  };
  performanceAudit: {
    summary: string;
    lighthouse: LighthouseResult;
    coreWebVitalsSummary: string;
    findings: AuditFinding[];
  };
  accessibilityAudit: {
    summary: string;
    altTextCoverage: string;
    formLabelingStatus: string;
    buttonNamesStatus: string;
    colorContrastStatus: string;
    wcagDisclaimer: string;
    findings: AuditFinding[];
  };
  localSeoOpportunities: {
    summary: string;
    businessNameMatch: string;
    locationMatch: string;
    napConsistency: string;
    localSchemaDetected: boolean;
    opportunities: string[];
    findings: AuditFinding[];
  };
  securityObservations: {
    summary: string;
    httpsEnforced: boolean;
    mixedContentDetected: boolean;
    securityHeadersAssessment: string;
    securityDisclaimer: string;
    findings: AuditFinding[];
  };
  priorityImprovementPlan: Array<{
    priority: Priority;
    action: string;
    category: FindingCategory;
    effort: 'Low' | 'Medium' | 'High';
    rationale: string;
    linkedFindingId?: string;
  }>;
  recommendedWebsiteStructure: {
    summary: string;
    suggestedSitemap: Array<{
      pageName: string;
      slug: string;
      purpose: string;
      keySections: string[];
    }>;
  };
  recommendedRedesignStrategy: {
    summary: string;
    corePillars: Array<{ title: string; description: string }>;
    designTokensSuggestion: {
      colorPaletteRecommendation: string;
      typographyRecommendation: string;
      layoutGuidance: string;
    };
  };
  nextSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    timelineRecommendation: string;
  }>;
}

export interface AuditJobConfig {
  url: string;
  businessName?: string;
  location?: string;
  industry?: string;
  businessType?: string;
  maxPages?: number;
  includeLighthouse?: boolean;
}

export type JobStatus = 'queued' | 'crawling' | 'analyzing' | 'synthesizing' | 'completed' | 'failed' | 'cancelled';

export type ClassificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type ClassificationProvenance =
  | 'USER_PROVIDED'
  | 'WEBSITE_EVIDENCE'
  | 'STRUCTURED_DATA'
  | 'DOMAIN_TOKEN'
  | 'AI_INFERRED'
  | 'INSUFFICIENT_EVIDENCE';

export type ClassificationVerificationStatus =
  | 'OBSERVED'
  | 'TESTED'
  | 'INFERRED'
  | 'NOT VERIFIED'
  | 'REQUIRES CLIENT APPROVAL';

export interface AlternativeClassification {
  industry: string;
  businessType: string;
  confidence: ClassificationConfidence;
  reason?: string;
  evidenceIds?: string[];
}

export interface IndustryClassification {
  industry: string;
  businessType: string;
  confidence: ClassificationConfidence;
  provenance: ClassificationProvenance;
  evidenceIds: string[];
  alternativeClassifications?: AlternativeClassification[];
  verificationStatus: ClassificationVerificationStatus;
  rationale?: string;
}

export interface SalesReportOpportunity {
  id: string;
  title: string;
  clientObservation: string;
  businessImpact: string;
  recommendedAction: string;
  evidenceIds: string[];
  priority: Priority;
  status: VerificationStatus;
}

export interface SalesReportWhatIsWorking {
  title: string;
  explanation: string;
  evidenceIds: string[];
  status: VerificationStatus;
}

export interface SalesReportWebsiteStructure {
  pageName: string;
  purpose: string;
  keySections: string[];
  targetAudience?: string;
  conversionGoal?: string;
}

export interface SalesReportNextStep {
  timeframe: string;
  title: string;
  description: string;
}

export interface SalesReport {
  isParkedOrIncomplete: boolean;
  websiteStatusSummary: string;
  businessName: string;
  businessNameProvenance: 'USER_PROVIDED' | 'INFERRED FROM WEBSITE' | 'INFERRED FROM DOMAIN' | 'NOT PROVIDED';
  location: string;
  locationProvenance: 'USER_PROVIDED' | 'WEBSITE_EVIDENCE' | 'STRUCTURED_DATA' | 'INFERRED' | 'NOT_PROVIDED';
  industry: string;
  businessType: string;
  industryConfidence: ClassificationConfidence;
  classificationProvenance: ClassificationProvenance;
  classification: IndustryClassification;
  whatIsWorking: SalesReportWhatIsWorking[];
  topOpportunities: SalesReportOpportunity[];
  whyTheseMatter: string;
  recommendedStructure: SalesReportWebsiteStructure[];
  structureStatus: ClassificationVerificationStatus;
  implementationRoadmap: SalesReportNextStep[];
  agencyCta: {
    title: string;
    message: string;
    contactPrompt: string;
  };
}

export interface AuditJob {
  id: string;
  config: AuditJobConfig;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
  currentStepMessage: string;
  crawledPagesCount: number;
  totalPagesToCrawl: number;
  error?: string;
  pages: PageRecord[];
  crawlResult?: any;
  evidenceRegistry: EvidenceRecord[];
  findings: AuditFinding[];
  lighthouse?: LighthouseResult;
  report?: Report20Sections;
  salesReport?: SalesReport;
  pdfPath?: string;
  clientPdfPath?: string;
  internalPdfPath?: string;
  salesPdfPath?: string;
}

export interface AuditSummaryItem {
  id: string;
  url: string;
  businessName?: string;
  location?: string;
  createdAt: string;
  completedAt?: string;
  status: JobStatus;
  totalPagesCrawled: number;
  findingsCount: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
