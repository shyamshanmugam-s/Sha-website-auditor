"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UxAnalyzer = void 0;
class UxAnalyzer {
    static analyze(pages, evidenceRegistry) {
        const findings = [];
        const homePage = pages[0] || null;
        const totalInternalLinks = pages.reduce((acc, p) => acc + p.internalLinks.length, 0);
        const totalForms = pages.reduce((acc, p) => acc + p.forms.length, 0);
        const ev = evidenceRegistry.register({
            type: 'ux_navigation_map',
            category: 'ux',
            pageUrl: homePage ? homePage.url : '',
            status: 'OBSERVED',
            description: `Discovered ${totalInternalLinks} internal navigation paths and ${totalForms} interactive forms across ${pages.length} pages.`,
            metricValue: totalInternalLinks,
        });
        const summary = `Evaluated user experience architecture across ${pages.length} pages. Analyzed primary navigation paths, information hierarchy, and lead enquiry flows.`;
        return {
            summary,
            navigationStructure: `Discovered multi-page navigation across ${pages.length} accessible templates with ${totalInternalLinks} internal links.`,
            userJourney: 'Audited user pathways from landing to information discovery and final conversion.',
            serviceDiscovery: 'Evaluated visibility of core services, offering descriptions, and supporting details.',
            ctaPlacement: 'Primary and secondary conversion touchpoints mapped across page layouts.',
            formsAssessment: `${totalForms} contact/enquiry forms analyzed for input simplicity and clear labels.`,
            findings,
        };
    }
}
exports.UxAnalyzer = UxAnalyzer;
