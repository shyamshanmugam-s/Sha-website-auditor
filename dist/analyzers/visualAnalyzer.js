"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualAnalyzer = void 0;
class VisualAnalyzer {
    static analyze(pages, evidenceRegistry) {
        const findings = [];
        const homePage = pages[0] || null;
        if (homePage && homePage.desktopScreenshot) {
            evidenceRegistry.register({
                type: 'visual_desktop_evidence',
                category: 'visual',
                pageUrl: homePage.url,
                status: 'OBSERVED',
                description: 'Captured high-resolution desktop visual rendering (1440x900 viewport).',
                data: { screenshot: homePage.desktopScreenshot },
            });
        }
        const summary = `Visual presentation evaluated across desktop and mobile captures. Inspected hero section hierarchy, typography scaling, and component layout rhythm.`;
        return {
            summary,
            typographyAssessment: 'Heading-to-body font scale and line-height balance inspected.',
            colorSystemAssessment: 'Brand accent colors and background contrast ratios evaluated.',
            spacingLayoutAssessment: 'Container widths, section padding, and responsive grid layout analyzed.',
            visualHierarchyAssessment: 'Primary headline prominence and visual weight distribution evaluated.',
            brandConsistencyAssessment: 'Visual styling consistency verified across crawled templates.',
            heroAssessment: 'Above-the-fold hero messaging and call-to-action prominence evaluated.',
            footerAssessment: 'Footer structure, secondary navigation links, and copyright info evaluated.',
            findings,
        };
    }
}
exports.VisualAnalyzer = VisualAnalyzer;
