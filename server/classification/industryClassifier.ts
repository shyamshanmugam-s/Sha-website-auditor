import {
  AuditJob,
  IndustryClassification,
  ClassificationConfidence,
  ClassificationProvenance,
  ClassificationVerificationStatus,
  AlternativeClassification,
} from '../types/audit.js';
import { INDUSTRY_TAXONOMY, IndustryDefinition, SubBusinessType } from './industryTaxonomy.js';
import { DomainTokenizer } from './domainTokenizer.js';

interface ScoreEntry {
  industry: IndustryDefinition;
  businessType: SubBusinessType;
  score: number;
  evidenceIds: string[];
  matchedSignals: string[];
  hasStructuredData: boolean;
  hasMultiPageMatch: boolean;
  hasContentMatch: boolean;
  hasDomainMatch: boolean;
}

export class IndustryClassifier {
  /**
   * General, multi-source industry and business-type classification engine.
   * Works on any website without hardcoded domain checks.
   */
  public static classify(audit: AuditJob): IndustryClassification {
    const config = audit.config || { url: '' };

    // 1. Check User-Provided Override (Highest Priority)
    if (config.industry && config.industry.trim().length > 0) {
      const userInd = config.industry.trim();
      const userBiz = config.businessType?.trim() || this.findDefaultBusinessType(userInd);
      return {
        industry: userInd,
        businessType: userBiz,
        confidence: 'HIGH',
        provenance: 'USER_PROVIDED',
        evidenceIds: (audit.crawlResult?.pages || (audit as any).pages)?.[0]?.evidenceIds?.slice(0, 1) || ['E-001'],
        verificationStatus: 'OBSERVED',
        rationale: 'User explicitly specified the business industry during audit configuration.',
      };
    }

    // 2. Extract Evidence Corpus from All Crawled Pages
    const pages = audit.crawlResult?.pages || (audit as any).pages || [];
    const isParkedOrIncomplete = this.isParkedOrThin(audit);

    // Collect structured data types across pages and evidence registry
    const structuredSchemaTypes = this.extractSchemaTypes(audit, pages);

    // Collect domain tokens
    const { tokens: rawDomainTokens } = DomainTokenizer.tokenize(config.url);
    const domainTokens = DomainTokenizer.filterNoise(rawDomainTokens);

    // Score all industries in the taxonomy
    const scores: ScoreEntry[] = [];

    for (const industry of INDUSTRY_TAXONOMY) {
      if (industry.id === 'unknown' || industry.id === 'other') continue;

      for (const bType of industry.businessTypes) {
        const scoreResult = this.evaluateSubIndustry(
          industry,
          bType,
          pages,
          structuredSchemaTypes,
          domainTokens,
          audit,
          isParkedOrIncomplete
        );

        if (scoreResult.score > 0) {
          scores.push(scoreResult);
        }
      }
    }

    // Sort by descending score
    scores.sort((a, b) => b.score - a.score);

    // 3. Evaluate Top Matches
    if (scores.length === 0 || scores[0].score < 4) {
      return {
        industry: 'Unknown',
        businessType: 'Unknown Business Type',
        confidence: 'UNKNOWN',
        provenance: 'INSUFFICIENT_EVIDENCE',
        evidenceIds: pages[0]?.evidenceIds?.slice(0, 1) || [],
        verificationStatus: 'NOT VERIFIED',
        rationale: 'Insufficient website evidence or domain tokens to determine business industry.',
      };
    }

    const top = scores[0];
    const runnerUp = scores.length > 1 ? scores[1] : null;

    // 4. Ambiguity Detection & Multi-Disciplinary Resolution
    // Check if domain tokens contain BOTH architecture and interior tokens
    const lowerTokens = domainTokens.map((t) => t.toLowerCase());
    const hasArchDomainToken = lowerTokens.some((t) => ['architecture', 'architect', 'architects', 'architectural'].includes(t));
    const hasInteriorDomainToken = lowerTokens.some((t) => ['interior', 'interiors', 'decor', 'decorating'].includes(t));
    const bothDomainTokensPresent = hasArchDomainToken && hasInteriorDomainToken;

    // Check if live website content contains strong evidence for both
    const bothContentEvidencePresent =
      !isParkedOrIncomplete &&
      runnerUp !== null &&
      top.hasContentMatch &&
      runnerUp.hasContentMatch &&
      top.score >= 30 &&
      runnerUp.score >= 20 &&
      top.score - runnerUp.score < 20 &&
      ((top.businessType.id.includes('interior') && runnerUp.businessType.id.includes('architecture')) ||
        (top.businessType.id.includes('architecture') && runnerUp.businessType.id.includes('interior')));

    if (bothDomainTokensPresent || bothContentEvidencePresent) {
      const blendedEvidence = Array.from(new Set([...top.evidenceIds, ...(runnerUp ? runnerUp.evidenceIds : [])])).slice(0, 5);
      return {
        industry: 'Interior & Architecture',
        businessType: 'Architecture & Interior Studio',
        confidence: isParkedOrIncomplete ? 'LOW' : 'MEDIUM',
        provenance: isParkedOrIncomplete ? 'DOMAIN_TOKEN' : top.hasStructuredData ? 'STRUCTURED_DATA' : 'WEBSITE_EVIDENCE',
        evidenceIds: blendedEvidence,
        verificationStatus: isParkedOrIncomplete ? 'REQUIRES CLIENT APPROVAL' : 'OBSERVED',
        rationale: isParkedOrIncomplete
          ? 'Domain tokens contain both architecture and interior design terms, indicating a combined multidisciplinary studio.'
          : 'Available website evidence supports both architectural design and interior design practices, representing an integrated multidisciplinary studio.',
        alternativeClassifications: runnerUp
          ? [
              {
                industry: top.industry.name,
                businessType: top.businessType.name,
                confidence: 'MEDIUM',
                reason: `Strong signals detected for ${top.businessType.name} (${top.matchedSignals.slice(0, 3).join(', ')})`,
                evidenceIds: top.evidenceIds,
              },
              {
                industry: runnerUp.industry.name,
                businessType: runnerUp.businessType.name,
                confidence: 'MEDIUM',
                reason: `Significant signals detected for ${runnerUp.businessType.name} (${runnerUp.matchedSignals.slice(0, 3).join(', ')})`,
                evidenceIds: runnerUp.evidenceIds,
              },
            ]
          : undefined,
      };
    }

    // 5. Confidence, Provenance, and Verification Status Determination
    let confidence: ClassificationConfidence = 'LOW';
    let provenance: ClassificationProvenance = 'DOMAIN_TOKEN';
    let verificationStatus: ClassificationVerificationStatus = 'REQUIRES CLIENT APPROVAL';

    if (isParkedOrIncomplete) {
      // Parked / Holding site: domain tokens or thin page
      confidence = 'LOW';
      provenance = 'DOMAIN_TOKEN';
      verificationStatus = 'REQUIRES CLIENT APPROVAL';
    } else if (top.hasStructuredData) {
      confidence = 'HIGH';
      provenance = 'STRUCTURED_DATA';
      verificationStatus = 'OBSERVED';
    } else if (top.hasContentMatch && top.score >= 25) {
      confidence = 'HIGH';
      provenance = 'WEBSITE_EVIDENCE';
      verificationStatus = 'OBSERVED';
    } else if (top.hasContentMatch && top.score >= 12) {
      confidence = 'MEDIUM';
      provenance = 'WEBSITE_EVIDENCE';
      verificationStatus = 'OBSERVED';
    } else if (top.hasDomainMatch && !top.hasContentMatch) {
      confidence = 'LOW';
      provenance = 'DOMAIN_TOKEN';
      verificationStatus = 'REQUIRES CLIENT APPROVAL';
    } else {
      confidence = 'LOW';
      provenance = 'WEBSITE_EVIDENCE';
      verificationStatus = 'INFERRED';
    }

    const alternatives: AlternativeClassification[] = [];
    if (runnerUp && runnerUp.score >= 15 && runnerUp.industry.id !== top.industry.id) {
      alternatives.push({
        industry: runnerUp.industry.name,
        businessType: runnerUp.businessType.name,
        confidence: runnerUp.score >= 25 ? 'MEDIUM' : 'LOW',
        reason: `Secondary keyword matches observed (${runnerUp.matchedSignals.slice(0, 2).join(', ')})`,
        evidenceIds: runnerUp.evidenceIds,
      });
    }

    return {
      industry: top.industry.name,
      businessType: top.businessType.name,
      confidence,
      provenance,
      evidenceIds: top.evidenceIds,
      verificationStatus,
      rationale: `Classified as ${top.businessType.name} (${top.industry.name}) based on ${top.matchedSignals.slice(0, 4).join(', ')}.`,
      alternativeClassifications: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  /**
   * Evaluates a sub-industry against crawled pages, structured data, and domain tokens.
   */
  private static evaluateSubIndustry(
    industry: IndustryDefinition,
    bType: SubBusinessType,
    pages: any[],
    structuredSchemaTypes: string[],
    domainTokens: string[],
    audit: AuditJob,
    isParked: boolean
  ): ScoreEntry {
    let score = 0;
    const evidenceIds: string[] = [];
    const matchedSignals: string[] = [];
    let hasStructuredData = false;
    let hasMultiPageMatch = false;
    let hasContentMatch = false;
    let hasDomainMatch = false;

    // 1. Structured Data Schema Match (Weight: 35)
    if (industry.schemaTypes.some((st) => structuredSchemaTypes.includes(st.toLowerCase()))) {
      score += 35;
      hasStructuredData = true;
      matchedSignals.push('Schema.org structured data');
      const schemaEv = audit.evidenceRegistry?.find((e) => e.type === 'schema_jsonld');
      if (schemaEv) evidenceIds.push(schemaEv.id);
    }

    if (bType.schemaTypes && bType.schemaTypes.some((st) => structuredSchemaTypes.includes(st.toLowerCase()))) {
      score += 20;
      hasStructuredData = true;
      matchedSignals.push(`Schema sub-type (${bType.name})`);
    }

    // 2. Active Website Content Evaluation (Titles, Headings, Multi-Page Content)
    if (!isParked && pages.length > 0) {
      let matchingPagesCount = 0;

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const page = pages[pIdx];

        // Collect all text from page
        const titleText = (page.title || '').toLowerCase();
        const descText = (page.metaDescription || '').toLowerCase();
        const headingsText = (page.headings || []).join(' ').toLowerCase();
        const bodyText = (page.textSample || '').toLowerCase();
        const navText = (page.links?.internal?.map((l: any) => l.text) || []).join(' ').toLowerCase();

        const fullPageText = [titleText, descText, headingsText, bodyText, navText].join(' ');

        let pageMatched = false;

        // Check specific business type keywords (higher weight)
        for (const kw of bType.keywords) {
          if (this.containsKeyword(fullPageText, kw)) {
            // Extra bonus for presence in title or headings
            let kwScore = pIdx === 0 ? 15 : 10;
            if (this.containsKeyword(titleText, kw)) kwScore += 10;
            if (this.containsKeyword(headingsText, kw)) kwScore += 8;

            score += kwScore;
            pageMatched = true;
            hasContentMatch = true;
            matchedSignals.push(`Specific business keyword "${kw}"`);
            if (page.evidenceIds?.length) evidenceIds.push(page.evidenceIds[0]);
          }
        }

        // Check industry broad keywords
        for (const kw of industry.keywords) {
          if (this.containsKeyword(fullPageText, kw)) {
            let kwScore = pIdx === 0 ? 10 : 6;
            if (this.containsKeyword(titleText, kw)) kwScore += 8;
            if (this.containsKeyword(headingsText, kw)) kwScore += 6;

            score += kwScore;
            pageMatched = true;
            hasContentMatch = true;
            matchedSignals.push(`Keyword "${kw}"`);
            if (page.evidenceIds?.length) evidenceIds.push(page.evidenceIds[0]);
          }
        }

        if (pageMatched) {
          matchingPagesCount++;
        }
      }

      // Bonus for multi-page confirmation
      if (matchingPagesCount >= 2) {
        score += 20;
        hasMultiPageMatch = true;
        matchedSignals.push(`Confirmed across ${matchingPagesCount} inspected pages`);
      }
    }

    // 3. Domain Token Evaluation
    // Domain tokens are evaluated with precision to avoid false cross-type bleeding on parked domains.
    const lowerTokens = domainTokens.map((t) => t.toLowerCase());

    // Check specific business type keywords
    for (const kw of bType.keywords) {
      const kwLower = kw.toLowerCase();
      const kwWords = kwLower
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !['and', 'or', 'the', 'a', 'an', 'of', 'in', 'for', 'with', '&'].includes(w));

      if (kwWords.length === 0) continue;

      if (kwWords.length === 1) {
        const singleKw = kwWords[0];
        if (lowerTokens.includes(singleKw)) {
          score += 8;
          hasDomainMatch = true;
          matchedSignals.push(`Domain token "${singleKw}"`);
          if (pages[0]?.evidenceIds?.length) evidenceIds.push(pages[0].evidenceIds[0]);
        }
      } else {
        // Multi-word keyword: require ALL significant words of the keyword to be present in domain tokens
        const allWordsPresent = kwWords.every((w) => lowerTokens.includes(w));
        if (allWordsPresent) {
          score += 12; // Higher precision match for multi-word domain tokens
          hasDomainMatch = true;
          matchedSignals.push(`Domain multi-token "${kw}"`);
          if (pages[0]?.evidenceIds?.length) evidenceIds.push(pages[0].evidenceIds[0]);
        }
      }
    }

    // Check sub-business type title terms (e.g. "firm", "studio", "clinic", "restaurant")
    const bTypeNameWords = bType.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['and', 'or', 'the', 'a', 'an', 'of', 'in', 'for', 'with', '&'].includes(w));
    for (const nw of bTypeNameWords) {
      if (lowerTokens.includes(nw)) {
        score += 4;
        hasDomainMatch = true;
        matchedSignals.push(`Domain role token "${nw}"`);
        if (pages[0]?.evidenceIds?.length) evidenceIds.push(pages[0].evidenceIds[0]);
      }
    }

    // Check industry broad keywords ONLY if single-word and exact match
    for (const kw of industry.keywords) {
      const kwLower = kw.toLowerCase();
      const kwWords = kwLower
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !['and', 'or', 'the', 'a', 'an', 'of', 'in', 'for', 'with', '&'].includes(w));
      if (kwWords.length === 1 && lowerTokens.includes(kwWords[0])) {
        score += 3;
        hasDomainMatch = true;
        matchedSignals.push(`Domain industry token "${kwWords[0]}"`);
        if (pages[0]?.evidenceIds?.length) evidenceIds.push(pages[0].evidenceIds[0]);
      }
    }

    // Deduplicate evidence IDs and signals
    const uniqueEvIds = Array.from(new Set(evidenceIds)).slice(0, 4);
    const uniqueSignals = Array.from(new Set(matchedSignals));

    return {
      industry,
      businessType: bType,
      score,
      evidenceIds: uniqueEvIds,
      matchedSignals: uniqueSignals,
      hasStructuredData,
      hasMultiPageMatch,
      hasContentMatch,
      hasDomainMatch,
    };
  }

  /**
   * Helper to perform word boundary / substring matching.
   */
  private static containsKeyword(text: string, kw: string): boolean {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }

  /**
   * Extracts Schema.org @type across pages and evidence records.
   */
  private static extractSchemaTypes(audit: AuditJob, pages: any[]): string[] {
    const types: string[] = [];

    // From Crawled Pages
    for (const p of pages) {
      if (p.structuredData?.jsonLd && Array.isArray(p.structuredData.jsonLd)) {
        for (const item of p.structuredData.jsonLd) {
          if (item?.['@type']) types.push(String(item['@type']).toLowerCase());
          if (Array.isArray(item?.['@graph'])) {
            for (const sub of item['@graph']) {
              if (sub?.['@type']) types.push(String(sub['@type']).toLowerCase());
            }
          }
        }
      }
    }

    // From Evidence Registry
    if (audit.evidenceRegistry) {
      for (const ev of audit.evidenceRegistry) {
        if (ev.type === 'schema_jsonld' && ev.data) {
          if (ev.data['@type']) {
            types.push(String(ev.data['@type']).toLowerCase());
          }
          if (Array.isArray(ev.data['@graph'])) {
            for (const item of ev.data['@graph']) {
              if (item['@type']) types.push(String(item['@type']).toLowerCase());
            }
          }
        }
      }
    }

    return Array.from(new Set(types));
  }

  /**
   * Determines if a site has thin, holding, or insufficient business content.
   */
  private static isParkedOrThin(audit: AuditJob): boolean {
    if (audit.crawlResult?.isParkedOrHolding) return true;

    const pages = audit.crawlResult?.pages || (audit as any).pages || [];
    if (pages.length === 0) return true;

    const homePage = pages[0];
    const title = (homePage.title || '').toLowerCase();
    const htmlLen = homePage.contentLength || homePage.htmlLengthBytes || 0;
    const internalLinksCount = homePage.links?.internal?.length || homePage.internalLinks?.length || 0;
    const headingsCount = homePage.headings?.length || homePage.headingTree?.length || 0;
    const wordCount = homePage.wordCount || 0;

    const parkedTitles = ['access denied', '403 forbidden', 'parked', 'under construction', 'coming soon', 'domain for sale', 'buy this domain', 'index of /', 'default page'];
    if (parkedTitles.some((t) => title.includes(t))) {
      return true;
    }

    if (pages.length === 1 && internalLinksCount === 0 && headingsCount === 0 && htmlLen < 1500 && wordCount < 30) {
      return true;
    }

    return false;
  }

  /**
   * Finds default business type for a broad industry name.
   */
  private static findDefaultBusinessType(industryName: string): string {
    const match = INDUSTRY_TAXONOMY.find(
      (ind) => ind.name.toLowerCase() === industryName.toLowerCase() || ind.id.toLowerCase() === industryName.toLowerCase()
    );
    if (match && match.businessTypes.length > 0) {
      return match.businessTypes[0].name;
    }
    return industryName;
  }
}
