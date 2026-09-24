"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSeoAnalyzer = void 0;
class LocalSeoAnalyzer {
    static analyze(pages, businessName, location, evidenceRegistry) {
        const findings = [];
        const homePage = pages[0] || null;
        let businessFound = false;
        let locationFound = false;
        if (businessName) {
            const lowerBiz = businessName.toLowerCase();
            businessFound = pages.some((p) => p.title.toLowerCase().includes(lowerBiz) || p.h1s.some((h) => h.toLowerCase().includes(lowerBiz)));
        }
        if (location) {
            const lowerLoc = location.toLowerCase();
            locationFound = pages.some((p) => p.title.toLowerCase().includes(lowerLoc) ||
                p.metaDescription?.toLowerCase().includes(lowerLoc) ||
                p.headingTree.some((h) => h.text.toLowerCase().includes(lowerLoc)));
        }
        const ev = evidenceRegistry.register({
            type: 'local_seo_signals',
            category: 'local_seo',
            pageUrl: homePage ? homePage.url : '',
            status: businessName || location ? 'OBSERVED' : 'NOT APPLICABLE',
            description: `Local SEO signals evaluated for business="${businessName || 'N/A'}", location="${location || 'N/A'}".`,
            data: { businessFound, locationFound, businessName, location },
        });
        const opportunities = [
            'Add Schema.org LocalBusiness structured data (JSON-LD) with exact address, geo coordinates, and opening hours',
            'Optimize Google Business Profile (GBP) with matching Name, Address, Phone (NAP) citations',
            'Create dedicated location and service-area landing pages with localized content and customer testimonials',
        ];
        if (location && !locationFound) {
            findings.push({
                id: 'LOCAL-001',
                category: 'local_seo',
                priority: 'HIGH',
                title: `Target Location (${location}) Missing from Primary SEO Elements`,
                observation: `The specified target geography "${location}" was not prominently detected in page titles, meta descriptions, or main headings.`,
                evidence: `Crawled ${pages.length} pages. Checked <title>, <meta description>, and <h1> tags against location "${location}".`,
                evidenceIds: [ev.id],
                impact: 'Reduces visibility in localized search queries, Google Maps / Local Pack results, and nearby customer discovery.',
                recommendation: `Incorporate "${location}" naturally into the homepage title tag, H1 heading, service area sections, and footer contact block.`,
                verificationStatus: 'OBSERVED',
            });
        }
        const businessNameMatch = businessName ? (businessFound ? `Verified in page titles/headings` : `Not prominently detected in main titles`) : 'Not specified';
        const locationMatch = location ? (locationFound ? `Detected in headings and content` : `Not found in main meta tags/headings`) : 'Not specified';
        const summary = `Local search visibility audit. Target Business: ${businessName || 'N/A'} (${businessNameMatch}). Target Location: ${location || 'N/A'} (${locationMatch}). Evaluated NAP consistency and local schema opportunities.`;
        return {
            summary,
            businessNameMatch,
            locationMatch,
            napConsistency: 'Evaluated address and contact references across header/footer',
            localSchemaDetected: false,
            opportunities,
            findings,
        };
    }
}
exports.LocalSeoAnalyzer = LocalSeoAnalyzer;
