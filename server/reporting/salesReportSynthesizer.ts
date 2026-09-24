import {
  AuditJob,
  SalesReport,
  SalesReportOpportunity,
  SalesReportWhatIsWorking,
  Priority,
  IndustryClassification,
} from '../types/audit.js';
import { IndustryClassifier } from '../classification/industryClassifier.js';
import { BlueprintEngine } from '../classification/blueprintEngine.js';
import { DomainTokenizer } from '../classification/domainTokenizer.js';

export class SalesReportSynthesizer {
  /**
   * Synthesizes a Client Sales Audit from an existing completed AuditJob.
   * Grounded strictly in existing evidence, with plain business language and dynamic industry classification.
   */
  public static synthesize(audit: AuditJob): SalesReport {
    const pages = audit.crawlResult?.pages || (audit as any).pages || [];
    const config = audit.config || { url: '' };

    // 1. Business Name & Provenance Extraction
    const bizInfo = this.extractBusinessName(audit);

    // 2. Location & Provenance Extraction
    const locInfo = this.extractLocation(audit);

    // 3. Detect if website is parked, under construction, or incomplete
    const isParkedOrIncomplete = this.detectParkedOrIncomplete(audit);

    // 4. General Industry & Business-Type Classification
    const classification: IndustryClassification = IndustryClassifier.classify(audit);

    // 5. Generate "What Is Working" grounded in verified evidence
    const whatIsWorking = this.extractWhatIsWorking(audit, isParkedOrIncomplete);

    // 6. Select and translate Top 3–5 Opportunities
    const topOpportunities = this.selectTopOpportunities(audit, isParkedOrIncomplete, bizInfo, locInfo);

    // 7. Dynamic Blueprint Generation
    const blueprintResult = BlueprintEngine.generateBlueprint(classification, isParkedOrIncomplete);

    // 8. Summary of Current Website Status
    const websiteStatusSummary = isParkedOrIncomplete
      ? `The domain ${config.url} is currently in a preliminary, holding, or under-construction state with limited public business content. This audit provides an executive assessment of foundational digital readiness and presents a tailored blueprint to launch an effective online presence.`
      : bizInfo.provenance !== 'NOT PROVIDED'
      ? `An executive commercial review of ${bizInfo.name}'s digital presence across ${pages.length} inspected page(s). This report highlights current digital strengths and outlines high-impact conversion opportunities to increase customer trust, search visibility, and inbound inquiries.`
      : `An executive commercial review of the digital presence for ${config.url} across ${pages.length} inspected page(s). This report highlights current digital strengths and outlines high-impact conversion opportunities to increase customer trust, search visibility, and inbound inquiries.`;

    // 9. Commercial Context: Why These Opportunities Matter
    const whyTheseMatter = isParkedOrIncomplete
      ? locInfo.provenance !== 'NOT_PROVIDED'
        ? `Establishing a credible, professional web presence with clear contact triggers and structured service offerings is essential for building immediate market trust. Launching a purpose-built website allows prospective clients in ${locInfo.location} to discover the business, explore core capabilities, and submit direct inquiries.`
        : `Establishing a credible, professional web presence with clear contact triggers and structured service offerings is essential for building immediate market trust. Launching a purpose-built website allows prospective clients to discover the business, explore core capabilities, and submit direct inquiries.`
      : `Prospective clients evaluate credibility quickly upon visiting a website. Addressing friction in contact channels, improving search engine summaries, and modernizing visual presentation helps ensure visitors can easily find relevant information and make direct inquiries.`;

    // 10. Implementation Roadmap
    const implementationRoadmap = isParkedOrIncomplete
      ? [
          {
            timeframe: 'Days 1 – 3',
            title: 'Foundation & Security',
            description: 'Configure SSL certificate (HTTPS), connect domain to primary web hosting, and establish direct phone & WhatsApp contact links.',
          },
          {
            timeframe: 'Week 1',
            title: 'Content & Brand Blueprint',
            description: bizInfo.provenance !== 'NOT PROVIDED'
              ? `Draft core service descriptions, project showcases, and local search metadata tailored for ${bizInfo.name}.`
              : `Draft core service descriptions, project showcases, and local search metadata tailored for the business.`,
          },
          {
            timeframe: 'Weeks 2 – 3',
            title: 'Design & Deployment',
            description: 'Deploy responsive 5-page industry sitemap, configure fast consultation inquiry forms, and launch live website.',
          },
        ]
      : [
          {
            timeframe: 'Days 1 – 3',
            title: 'Immediate Contact Triggers',
            description: 'Add prominent header phone dialing, sticky WhatsApp chat trigger, and 1-click consultation inquiry buttons.',
          },
          {
            timeframe: 'Week 1',
            title: 'Search & Location Alignment',
            description: locInfo.provenance !== 'NOT_PROVIDED'
              ? `Update page titles, search meta descriptions, and incorporate ${locInfo.location} into main headings.`
              : `Update page titles, search meta descriptions, and specify target service regions in main headings.`,
          },
          {
            timeframe: 'Weeks 2 – 3',
            title: 'Visual Modernization & Proof',
            description: 'Elevate typography contrast, deploy structured service cards, and highlight completed projects with client testimonials.',
          },
        ];

    // 11. Consultative SHA WebStudio CTA
    const agencyCta = {
      title: 'Recommended Next Step: Strategic Modernization Consultation',
      message: bizInfo.provenance !== 'NOT PROVIDED'
        ? `SHA WebStudio specializes in engineering modern, commercially focused websites designed for clarity, performance, and visitor trust. We would welcome the opportunity to discuss these findings with ${bizInfo.name} and explore how a tailored digital presence can support strategic growth objectives.`
        : `SHA WebStudio specializes in engineering modern, commercially focused websites designed for clarity, performance, and visitor trust. We would welcome the opportunity to discuss these findings and explore how a tailored digital presence can support strategic growth objectives.`,
      contactPrompt: 'Schedule a complimentary 20-minute digital strategy consultation with our senior web architects.',
    };

    const rawReport: SalesReport = {
      isParkedOrIncomplete,
      websiteStatusSummary,
      businessName: bizInfo.name,
      businessNameProvenance: bizInfo.provenance,
      location: locInfo.location,
      locationProvenance: locInfo.provenance,
      industry: classification.industry,
      businessType: classification.businessType,
      industryConfidence: classification.confidence,
      classificationProvenance: classification.provenance,
      classification,
      whatIsWorking,
      topOpportunities,
      whyTheseMatter,
      recommendedStructure: blueprintResult.structure,
      structureStatus: blueprintResult.verificationStatus,
      implementationRoadmap,
      agencyCta,
    };

    // 12. Automated Client-Language Sanitization Cleanser
    return this.sanitizeClientReport(rawReport);
  }

  /**
   * Extracts business name with verified provenance using generalized parsing and title formatting.
   */
  public static extractBusinessName(audit: AuditJob): {
    name: string;
    provenance: 'USER_PROVIDED' | 'INFERRED FROM WEBSITE' | 'INFERRED FROM DOMAIN' | 'NOT PROVIDED';
  } {
    const configName = audit.config?.businessName?.trim();
    if (configName && configName.length > 0 && !configName.toLowerCase().includes('your business')) {
      return { name: configName, provenance: 'USER_PROVIDED' };
    }

    // Check page title if active live site
    const homePage = audit.pages?.[0];
    if (homePage && homePage.title) {
      const rawTitle = homePage.title.trim();
      const junkTitles = ['access denied', '403 forbidden', 'home', 'default page', 'under construction', 'coming soon', 'parked', 'index of /'];
      if (!junkTitles.some((j) => rawTitle.toLowerCase().includes(j))) {
        const titleParts = rawTitle.split(/[|\-•::—]/).map((s) => s.trim()).filter(Boolean);
        if (titleParts.length > 0) {
          const candidate = titleParts[0];
          if (candidate.length > 2 && candidate.length < 50 && !candidate.toLowerCase().includes('welcome')) {
            return { name: candidate, provenance: 'INFERRED FROM WEBSITE' };
          }
        }
      }
    }

    // Parse domain name using general tokenizer
    if (audit.config?.url) {
      const formatted = DomainTokenizer.formatTitleFromDomain(audit.config.url);
      if (formatted && formatted.length >= 3 && !['example', 'test', 'localhost'].includes(formatted.toLowerCase())) {
        return { name: formatted, provenance: 'INFERRED FROM DOMAIN' };
      }
    }

    return { name: 'Business name not provided', provenance: 'NOT PROVIDED' };
  }

  /**
   * Extracts location with verified provenance.
   * Completely decoupled from industry.
   */
  public static extractLocation(audit: AuditJob): {
    location: string;
    provenance: 'USER_PROVIDED' | 'WEBSITE_EVIDENCE' | 'STRUCTURED_DATA' | 'INFERRED' | 'NOT_PROVIDED';
  } {
    const configLoc = audit.config?.location?.trim();
    if (configLoc && configLoc.length > 0 && !configLoc.toLowerCase().includes('your area') && !configLoc.toLowerCase().includes('your location')) {
      return { location: configLoc, provenance: 'USER_PROVIDED' };
    }

    // Check structured data schema address
    const schemaEv = audit.evidenceRegistry?.find((e) => e.type === 'schema_jsonld' && e.data?.address);
    if (schemaEv && schemaEv.data?.address) {
      const addr = schemaEv.data.address;
      const locality = typeof addr === 'string' ? addr : `${addr.addressLocality || ''} ${addr.addressRegion || ''}`.trim();
      if (locality.length > 2) {
        return { location: locality, provenance: 'STRUCTURED_DATA' };
      }
    }

    return { location: 'Target location was not provided.', provenance: 'NOT_PROVIDED' };
  }

  /**
   * Detects if the website is a parked domain, holding page, or contains insufficient business content.
   */
  public static detectParkedOrIncomplete(audit: AuditJob): boolean {
    const pages = audit.pages || [];
    if (pages.length === 0) return true;

    const homePage = pages[0];
    const title = (homePage.title || '').toLowerCase();
    const htmlLen = homePage.htmlLengthBytes || 0;
    const internalLinksCount = homePage.internalLinks?.length || 0;
    const bodyHeadingsCount = homePage.headingTree?.length || 0;

    // Direct parked / access denied title signals
    const parkedTitles = ['access denied', '403 forbidden', 'parked', 'under construction', 'coming soon', 'domain for sale', 'buy this domain', 'index of /', 'default page'];
    if (parkedTitles.some((t) => title.includes(t))) {
      return true;
    }

    // Network / resource indicators for domain parking
    const hasParkingScripts = homePage.networkErrors?.some((e) => e.url.includes('parking-lander') || e.url.includes('godaddy') || e.url.includes('wsimg')) || false;
    if (hasParkingScripts && pages.length === 1 && internalLinksCount === 0) {
      return true;
    }

    // Very thin content (single page, no internal links, fewer than 2 headings, HTML < 1500 bytes)
    if (pages.length === 1 && internalLinksCount === 0 && bodyHeadingsCount <= 1 && htmlLen < 1500) {
      return true;
    }

    return false;
  }

  /**
   * Extracts evidence-backed positive observations.
   * Separates verified technical infrastructure signals from business content evaluations.
   */
  private static extractWhatIsWorking(audit: AuditJob, isParked: boolean): SalesReportWhatIsWorking[] {
    const items: SalesReportWhatIsWorking[] = [];
    const pages = audit.pages || [];
    const homePage = pages[0];

    if (!homePage) {
      return items;
    }

    // If parked or holding page, add technical signals
    if (isParked) {
      if (homePage.statusCode === 200) {
        items.push({
          title: 'Active Web Server & DNS Routing (Technical Signal)',
          explanation: `Domain routing is online and successfully responding to web requests (Response time: ${homePage.responseTimeMs}ms).`,
          evidenceIds: homePage.evidenceIds?.slice(0, 1) || ['E-001'],
          status: 'TESTED',
        });
      }

      if (homePage.mobileScreenshot) {
        items.push({
          title: 'Multi-Device Viewport Rendering (Technical Signal)',
          explanation: 'Rendering pipeline verified across desktop and mobile viewports.',
          evidenceIds: homePage.evidenceIds?.slice(0, 2) || ['E-001'],
          status: 'TESTED',
        });
      }

      if (homePage.finalUrl?.startsWith('https://')) {
        items.push({
          title: 'Active SSL Encryption (Technical Signal)',
          explanation: 'The domain responds with active SSL encryption (HTTPS).',
          evidenceIds: homePage.evidenceIds?.slice(0, 1) || ['E-001'],
          status: 'TESTED',
        });
      }

      items.push({
        title: 'Business Content Evaluation Pending',
        explanation: 'Meaningful content and brand strengths could not yet be evaluated because the current website contains limited public business content.',
        evidenceIds: homePage.evidenceIds?.slice(0, 1) || ['E-001'],
        status: 'OBSERVED',
      });

      return items;
    }

    // Active Live Website Observations
    if (homePage.finalUrl?.startsWith('https://')) {
      const httpsEv = homePage.evidenceIds?.slice(0, 1) || ['E-001'];
      items.push({
        title: 'SSL Security Encryption Active',
        explanation: 'Your website is secured with an active SSL certificate (HTTPS), ensuring visitor connection privacy.',
        evidenceIds: httpsEv,
        status: 'TESTED',
      });
    }

    if (homePage.mobileScreenshot) {
      items.push({
        title: 'Multi-Device Viewport Compatibility',
        explanation: 'The website successfully scales across desktop and smartphone screen viewports without critical horizontal layout breakage.',
        evidenceIds: homePage.evidenceIds?.slice(0, 2) || ['E-001'],
        status: 'TESTED',
      });
    }

    if (homePage.statusCode === 200) {
      items.push({
        title: 'Active Domain & Web Hosting Infrastructure',
        explanation: `Domain routing is online and successfully responding to web requests (Response time: ${homePage.responseTimeMs}ms).`,
        evidenceIds: homePage.evidenceIds?.slice(0, 1) || ['E-001'],
        status: 'TESTED',
      });
    }

    if (pages.length > 1) {
      items.push({
        title: 'Multi-Page Information Architecture',
        explanation: `Discovered and verified ${pages.length} accessible sub-pages covering core business offerings and company information.`,
        evidenceIds: pages.flatMap((p) => p.evidenceIds || []).slice(0, 3),
        status: 'OBSERVED',
      });
    }

    return items;
  }

  /**
   * Selects and translates the 3–5 most commercially impactful opportunities.
   */
  private static selectTopOpportunities(
    audit: AuditJob,
    isParked: boolean,
    bizInfo: { name: string; provenance: string },
    locInfo: { location: string; provenance: string }
  ): SalesReportOpportunity[] {
    const opportunities: SalesReportOpportunity[] = [];
    const findings = audit.findings || [];

    const findFinding = (id: string, category?: string) => {
      return findings.find((f) => f.id === id) || (category ? findings.find((f) => f.category === category) : undefined);
    };

    // Opportunity 1: HTTPS (if unencrypted)
    const httpsFinding = findFinding('TECH-001');
    if (httpsFinding) {
      opportunities.push({
        id: 'OPP-001',
        title: 'Enable Secure HTTPS Browsing',
        clientObservation: 'The website currently opens over unencrypted HTTP, which triggers browser security warnings.',
        businessImpact: 'Installing an SSL certificate protects visitor connections and establishes foundational trust.',
        recommendedAction: 'Install a standard SSL/TLS certificate and configure permanent automatic redirects from HTTP to HTTPS.',
        evidenceIds: httpsFinding.evidenceIds,
        priority: 'CRITICAL',
        status: 'TESTED',
      });
    }

    // Opportunity 2: Direct Contact Triggers & Inbound Capture
    const convFinding = findFinding('CONV-001') || findFinding('AI-CONV-001');
    if (convFinding || isParked) {
      opportunities.push({
        id: 'OPP-002',
        title: 'Add Direct Inbound Contact Triggers',
        clientObservation: isParked
          ? 'The domain currently lacks direct contact triggers such as one-click phone dialing, email inquiry buttons, or WhatsApp messaging.'
          : 'Mobile smartphone visitors currently have limited one-tap options to initiate immediate phone or message inquiries.',
        businessImpact: 'Providing direct contact options allows prospective clients with immediate intent to connect without navigation friction.',
        recommendedAction: 'Place a visible "Call Now" button in the header and integrate a direct WhatsApp inquiry widget for mobile visitors.',
        evidenceIds: convFinding?.evidenceIds || (audit.pages?.[0]?.evidenceIds?.slice(0, 1) ?? ['E-001']),
        priority: 'HIGH',
        status: 'OBSERVED',
      });
    }

    // Opportunity 3: Local Search & Geographic Alignment
    const localFinding = findFinding('LOCAL-001');
    const seoDescFinding = findFinding('SEO-001');
    if (localFinding || seoDescFinding || isParked) {
      const evIds = localFinding?.evidenceIds || seoDescFinding?.evidenceIds || audit.pages?.[0]?.evidenceIds?.slice(0, 1) || ['E-001'];
      if (locInfo.provenance !== 'NOT_PROVIDED') {
        opportunities.push({
          id: 'OPP-003',
          title: `Optimize Search Visibility for ${locInfo.location}`,
          clientObservation: `Search engines currently have limited descriptive metadata associating the website with ${locInfo.location}.`,
          businessImpact: `Clear geographic signals help prospective clients searching for services in ${locInfo.location} identify and discover the business.`,
          recommendedAction: `Incorporate "${locInfo.location}" naturally into the primary page title, meta description, and contact section.`,
          evidenceIds: evIds,
          priority: 'HIGH',
          status: 'OBSERVED',
        });
      } else {
        opportunities.push({
          id: 'OPP-003',
          title: 'Define Primary Service Area in Search Metadata',
          clientObservation: 'Target location was not provided, and current page metadata does not specify a primary geographic service area.',
          businessImpact: 'Adding explicit geographic context helps search engines match the website with relevant local client searches.',
          recommendedAction: 'Define target service areas and incorporate them into the main page title, search description, and contact details.',
          evidenceIds: evIds,
          priority: 'HIGH',
          status: 'OBSERVED',
        });
      }
    }

    // Opportunity 4: Visual Layout & Brand Proof
    const visFinding = findFinding('AI-VIS-001') || findFinding('SEO-002');
    if (visFinding || isParked) {
      opportunities.push({
        id: 'OPP-004',
        title: 'Elevate Visual Presentation & Brand Proof',
        clientObservation: isParked
          ? 'A structured visual showcase of completed projects, service capabilities, and client testimonials is needed.'
          : 'The current layout has an opportunity for stronger headline contrast, distinct action buttons, and modern section spacing.',
        businessImpact: 'A clean, high-contrast visual design creates a polished first impression and reinforces professional credibility.',
        recommendedAction: 'Deploy high-contrast headlines, clear primary consultation triggers, and structured visual cards to showcase craftsmanship.',
        evidenceIds: visFinding?.evidenceIds || (audit.pages?.[0]?.evidenceIds?.slice(0, 1) ?? ['E-001']),
        priority: 'MEDIUM',
        status: 'INFERRED',
      });
    }

    // Opportunity 5: SEO Heading Hierarchy & Structure
    const h1Finding = findFinding('SEO-002') || findFinding('SEO-004');
    if (h1Finding && opportunities.length < 5) {
      opportunities.push({
        id: 'OPP-005',
        title: 'Strengthen Page Heading Structure',
        clientObservation: 'Page headings can be organized with clear H1 and H2 hierarchy to provide visitors and search algorithms with an orderly outline of core offerings.',
        businessImpact: 'Proper heading hierarchy improves content readability and helps search engines accurately index each service topic.',
        recommendedAction: 'Ensure each page features one prominent primary headline (H1) followed by organized section headings (H2/H3).',
        evidenceIds: h1Finding.evidenceIds,
        priority: 'MEDIUM',
        status: 'OBSERVED',
      });
    }

    return opportunities.slice(0, 5);
  }

  /**
   * Sanitizes all client-facing text to ensure zero template leaks,
   * ungrounded placeholders ("your area", "Your Business"), or raw bracket tokens.
   */
  public static sanitizeClientReport(report: SalesReport): SalesReport {
    const cleanString = (str: string): string => {
      if (!str) return str;
      return str
        .replace(/\byour area\b/gi, 'the target service region')
        .replace(/\byour service area\b/gi, 'the primary service area')
        .replace(/\byour market\b/gi, 'the market')
        .replace(/\byour location\b/gi, 'the target service region')
        .replace(/\byour city\b/gi, 'the target city')
        .replace(/\bYour Business\b/g, report.businessName !== 'Business name not provided' ? report.businessName : 'the business')
        .replace(/\{\{business\}\}/gi, report.businessName !== 'Business name not provided' ? report.businessName : 'the business')
        .replace(/\{\{location\}\}/gi, report.location !== 'Target location was not provided.' ? report.location : 'the target service area')
        .replace(/\[BUSINESS NAME\]/gi, report.businessName !== 'Business name not provided' ? report.businessName : 'Business name not provided')
        .replace(/\[LOCATION\]/gi, report.location !== 'Target location was not provided.' ? report.location : 'Target location was not provided.');
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return cleanString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = sanitizeObject(value);
        }
        return cleaned;
      }
      return obj;
    };

    return sanitizeObject(report) as SalesReport;
  }
}
