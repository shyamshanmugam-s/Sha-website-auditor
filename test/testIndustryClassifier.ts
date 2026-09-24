import { IndustryClassifier } from '../server/classification/industryClassifier.js';
import { BlueprintEngine } from '../server/classification/blueprintEngine.js';
import { DomainTokenizer } from '../server/classification/domainTokenizer.js';
import { SalesReportSynthesizer } from '../server/reporting/salesReportSynthesizer.js';
import { INDUSTRY_TAXONOMY, BROAD_INDUSTRIES } from '../server/classification/industryTaxonomy.js';
import { AuditJob } from '../server/types/audit.js';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

function recordResult(id: number, name: string, passed: boolean, notes: string = '') {
  results.push({ id, name, passed, notes });
  const status = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${status} ${id}. ${name} ${notes ? `(${notes})` : ''}`);
}

function createMockAuditJob(params: {
  url: string;
  businessName?: string;
  location?: string;
  industry?: string;
  businessType?: string;
  title?: string;
  metaDescription?: string;
  headings?: string[];
  navLinks?: string[];
  bodySample?: string;
  pages?: Array<{
    url: string;
    title?: string;
    description?: string;
    headings?: string[];
    bodySample?: string;
  }>;
  jsonLd?: any[];
  isParked?: boolean;
}): AuditJob {
  const pages = params.pages || [
    {
      url: params.url,
      title: params.title || '',
      description: params.metaDescription || '',
      headings: params.headings || [],
      bodySample: params.bodySample || '',
    },
  ];

  return {
    id: `mock-audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    progressPercent: 100,
    currentStepMessage: 'Completed',
    crawledPagesCount: pages.length,
    totalPagesToCrawl: pages.length,
    pages: pages.map((p) => ({
      url: p.url,
      finalUrl: p.url,
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html',
      responseTimeMs: 300,
      title: p.title || '',
      metaDescription: p.description || '',
      h1s: (p.headings || []).slice(0, 1),
      headingTree: (p.headings || []).map((h) => ({ tag: 'h2', text: h })),
      consoleErrors: [],
      networkErrors: [],
      internalLinks: (params.navLinks || []).map((text) => `${params.url}/${text.toLowerCase().replace(/\s+/g, '-')}`),
      externalLinks: [],
      images: [],
      forms: [],
      contactSignals: { phones: [], emails: [], whatsapps: [] },
      securityHeaders: {},
      htmlLengthBytes: (p.bodySample?.length || 500) + 1000,
      evidenceIds: ['E-001'],
    })),
    config: {
      url: params.url,
      businessName: params.businessName,
      location: params.location,
      industry: params.industry,
      businessType: params.businessType,
      maxPages: pages.length,
    },
    crawlResult: {
      baseUrl: params.url,
      pagesCrawled: pages.length,
      durationMs: 1200,
      sitemapFound: false,
      robotsAllowed: true,
      crawledUrls: pages.map((p) => p.url),
      pages: pages.map((p, idx) => ({
        url: p.url,
        status: 200,
        loadTimeMs: 300,
        contentLength: (p.bodySample?.length || 500) + 1000,
        title: p.title || '',
        metaDescription: p.description || '',
        h1Count: (p.headings || []).length > 0 ? 1 : 0,
        h2Count: Math.max(0, (p.headings || []).length - 1),
        headings: p.headings || [],
        links: {
          internal: (params.navLinks || []).map((text) => ({
            url: `${params.url}/${text.toLowerCase().replace(/\s+/g, '-')}`,
            text,
            isInternal: true,
          })),
          external: [],
          broken: [],
        },
        images: { total: 5, withAlt: 5, withoutAlt: 0, broken: [] },
        scripts: { total: 2, inline: 0, external: 2, thirdParty: [] },
        stylesheets: { total: 1, inline: 0, external: 1 },
        structuredData: params.jsonLd ? { jsonLd: params.jsonLd, microdata: [] } : undefined,
        canonicalUrl: p.url,
        isIndexable: true,
        wordCount: (p.bodySample || '').split(/\s+/).filter(Boolean).length || 50,
        textSample: p.bodySample || '',
      })),
      isParkedOrHolding: params.isParked ?? false,
    },
    findings: [],
    evidenceRegistry: [],
  };
}

async function runClassificationTests() {
  console.log('\n================================================================');
  console.log('🔬 UNIVERSAL INDUSTRY & BUSINESS-TYPE CLASSIFIER TEST SUITE');
  console.log('================================================================\n');

  // 1. Interior Design (Content-driven)
  const auditInterior = createMockAuditJob({
    url: 'https://www.luxeinteriorsdemo.com',
    title: 'Luxe Interior Design Studio - Residential & Commercial Space Decor',
    metaDescription: 'Award-winning luxury interior design, residential remodeling, space planning, lighting and bespoke furniture styling.',
    headings: ['Bespoke Interior Design & Space Planning', 'Residential Remodeling & Furniture Curation', 'Our Design Portfolio'],
    navLinks: ['About Studio', 'Residential Portfolio', 'Commercial Interiors', 'Design Process', 'Contact Us'],
    bodySample: 'We are a premier interior design studio creating bespoke residential interiors, architectural spatial planning, custom lighting design, and modern home decor.',
  });
  const classInterior = IndustryClassifier.classify(auditInterior);
  recordResult(
    1,
    'Interior Design (Content-Driven Classification)',
    classInterior.industry === 'Interior & Architecture' &&
      classInterior.businessType.includes('Interior') &&
      classInterior.confidence === 'HIGH' &&
      classInterior.provenance === 'WEBSITE_EVIDENCE',
    `Industry="${classInterior.industry}", BusinessType="${classInterior.businessType}", Confidence=${classInterior.confidence}`
  );

  // 2. Architecture Firm (Content-driven)
  const auditArch = createMockAuditJob({
    url: 'https://www.apexarchitectsdemo.com',
    title: 'Apex Architecture Firm - Sustainable Urban Planning & Master Planning',
    metaDescription: 'Innovative architectural design, commercial building master plans, sustainable structural planning, and urban architecture.',
    headings: ['Master Planning & Structural Architecture', 'Sustainable Commercial Buildings', 'Featured Architectural Works'],
    navLinks: ['Architecture Projects', 'Urban Master Planning', 'Sustainability', 'Studio Team', 'Inquiries'],
    bodySample: 'Our architectural practice specializes in commercial building design, sustainable urban master plans, structural blueprints, and LEED-certified architecture.',
  });
  const classArch = IndustryClassifier.classify(auditArch);
  recordResult(
    2,
    'Architecture Firm (Content-Driven Classification)',
    classArch.industry === 'Interior & Architecture' &&
      classArch.businessType.includes('Architecture') &&
      classArch.confidence === 'HIGH',
    `Industry="${classArch.industry}", BusinessType="${classArch.businessType}", Confidence=${classArch.confidence}`
  );

  // 3. Manufacturing (General)
  const auditMfg = createMockAuditJob({
    url: 'https://www.customfabricationmfg.com',
    title: 'Precision Metal Fabrication & CNC Machining - OEM Contract Manufacturing',
    metaDescription: 'ISO 9001 certified contract manufacturer delivering CNC machining, sheet metal fabrication, casting, and OEM industrial assembly.',
    headings: ['ISO 9001 Certified OEM Manufacturing', 'CNC Machining & Sheet Metal Fabrication', 'Request a Quote (RFQ)'],
    navLinks: ['Manufacturing Capabilities', 'Materials & Tolerances', 'Quality Certifications', 'Request a Quote'],
    bodySample: 'High-precision industrial manufacturing with state-of-the-art CNC machining centers, sheet metal stamping, tooling, casting, and rapid prototyping capabilities.',
  });
  const classMfg = IndustryClassifier.classify(auditMfg);
  recordResult(
    3,
    'Manufacturing (General Contract / OEM)',
    classMfg.industry === 'Manufacturing' &&
      classMfg.confidence === 'HIGH',
    `Industry="${classMfg.industry}", BusinessType="${classMfg.businessType}", Confidence=${classMfg.confidence}`
  );

  // 4. Industrial Pump Manufacturer (Sub-industry resolution)
  const auditPump = createMockAuditJob({
    url: 'https://www.vidhyaindustriespumps.com',
    title: 'Vidhya Industries - Heavy Duty Submersible & Centrifugal Industrial Pumps',
    metaDescription: 'Leading manufacturer of industrial submersible pumps, agricultural monoblock pumps, centrifugal water pumping systems, and slurry pumps.',
    headings: ['Centrifugal & Submersible Industrial Pump Systems', 'Flow Rate Specifications & Impeller Engineering', 'Download Pump Technical Data Sheets'],
    navLinks: ['Submersible Pumps', 'Centrifugal Pumps', 'Slurry & Sewage Pumps', 'Technical Specs', 'Dealers & RFQ'],
    bodySample: 'We engineer heavy-duty industrial centrifugal pumps, submersible water pumps, slurry pumping systems, impellers, hydraulic head pressure specifications, and high-efficiency agricultural monoblocks.',
  });
  const classPump = IndustryClassifier.classify(auditPump);
  recordResult(
    4,
    'Industrial Pump Manufacturer (Sub-Industry Resolution)',
    classPump.industry === 'Manufacturing' &&
      classPump.businessType.includes('Pump') &&
      classPump.confidence === 'HIGH',
    `Industry="${classPump.industry}", BusinessType="${classPump.businessType}", Confidence=${classPump.confidence}`
  );

  // 5. Fine Dining / Casual Restaurant
  const auditRestaurant = createMockAuditJob({
    url: 'https://www.savorybistrogrill.com',
    title: 'Savory Bistro & Wine Bar - Farm-to-Table Dinner & Private Dining',
    metaDescription: 'Seasonal dinner menu, chef tasting menu, fine wine pairings, patio seating, and online table reservations.',
    headings: ['Seasonal Chef Tasting Menu & Wine Pairings', 'Reserve a Table Online', 'Private Dining & Catering'],
    navLinks: ['Dinner Menu', 'Cocktails & Wine', 'Reserve Table', 'Private Events', 'Location & Hours'],
    bodySample: 'Experience exquisite culinary dining with locally sourced farm-to-table entrees, handcrafted cocktails, artisanal desserts, and seamless table reservations.',
  });
  const classRestaurant = IndustryClassifier.classify(auditRestaurant);
  recordResult(
    5,
    'Restaurant & Hospitality (Dining & Reservations)',
    classRestaurant.industry === 'Restaurant & Hospitality' &&
      classRestaurant.confidence === 'HIGH',
    `Industry="${classRestaurant.industry}", BusinessType="${classRestaurant.businessType}", Confidence=${classRestaurant.confidence}`
  );

  // 6. Cafe & Coffee Shop
  const auditCafe = createMockAuditJob({
    url: 'https://www.artisancoffeeroasters.com',
    title: 'Artisan Coffee Roasters - Single Origin Espresso & Bakery Cafe',
    metaDescription: 'Specialty coffee roastery, handcrafted espresso drinks, cold brew, organic pour-overs, and fresh morning pastries.',
    headings: ['Single Origin Roasted Coffee Beans', 'Espresso Bar & Seasonal Brews', 'Bakery Menu & Breakfast'],
    navLinks: ['Coffee Beans', 'Espresso Menu', 'Bakery', 'Cafe Locations', 'Order Online'],
    bodySample: 'Freshly roasted specialty coffee, single-origin Ethiopian and Colombian espresso beans, cold brew on tap, matcha lattes, and artisan baked croissants.',
  });
  const classCafe = IndustryClassifier.classify(auditCafe);
  recordResult(
    6,
    'Cafe & Coffee Shop (Sub-industry resolution)',
    classCafe.industry === 'Restaurant & Hospitality' &&
      classCafe.businessType.includes('Cafe') &&
      classCafe.confidence === 'HIGH',
    `Industry="${classCafe.industry}", BusinessType="${classCafe.businessType}", Confidence=${classCafe.confidence}`
  );

  // 7. Real Estate Agency
  const auditRealEstate = createMockAuditJob({
    url: 'https://www.premierpropertiesrealty.com',
    title: 'Premier Properties - Luxury Homes for Sale & Commercial Real Estate',
    metaDescription: 'Browse MLS property listings, residential homes for sale, luxury estates, commercial lease spaces, and schedule agent showings.',
    headings: ['Explore Featured Real Estate Listings', 'Schedule a Home Tour with a Realtor', 'Commercial Properties for Lease'],
    navLinks: ['Buy Homes', 'Sell Property', 'MLS Search', 'Mortgage Calculator', 'Our Agents'],
    bodySample: 'Search exclusive MLS real estate listings, open houses, luxury residential properties, commercial leasing opportunities, and connect with licensed real estate brokers.',
  });
  const classRealEstate = IndustryClassifier.classify(auditRealEstate);
  recordResult(
    7,
    'Real Estate (MLS Listings & Brokerage)',
    classRealEstate.industry === 'Real Estate' &&
      classRealEstate.confidence === 'HIGH',
    `Industry="${classRealEstate.industry}", BusinessType="${classRealEstate.businessType}", Confidence=${classRealEstate.confidence}`
  );

  // 8. Construction General Contractor
  const auditConstruction = createMockAuditJob({
    url: 'https://www.summitbuildersgc.com',
    title: 'Summit Builders - Commercial General Contractor & Renovation Services',
    metaDescription: 'Licensed general contractor providing commercial building construction, industrial renovations, project site supervision, and structural concrete framing.',
    headings: ['Commercial Construction & General Contracting', 'Site Supervision & Structural Framing', 'Safety & OSHA Compliance'],
    navLinks: ['Commercial Projects', 'Industrial Buildouts', 'General Contracting', 'Subcontractors', 'Bid Inquiries'],
    bodySample: 'Full-service general contractor handling commercial site excavation, steel framing, tenant buildouts, HVAC rough-ins, job site safety, and ground-up construction.',
  });
  const classConstruction = IndustryClassifier.classify(auditConstruction);
  recordResult(
    8,
    'Construction (General Contractor)',
    classConstruction.industry === 'Construction' &&
      classConstruction.confidence === 'HIGH',
    `Industry="${classConstruction.industry}", BusinessType="${classConstruction.businessType}", Confidence=${classConstruction.confidence}`
  );

  // 9. Dental Practice
  const auditDental = createMockAuditJob({
    url: 'https://www.brightsmilesdentistry.com',
    title: 'Bright Smiles Dental Clinic - Cosmetic Dentistry & Orthodontics',
    metaDescription: 'Comprehensive dental care: teeth whitening, Invisalign clear aligners, dental implants, root canals, and emergency dental appointments.',
    headings: ['Cosmetic Dentistry & Smile Makeovers', 'Invisalign & Teeth Whitening', 'Book Your Dental Appointment'],
    navLinks: ['Dental Services', 'Invisalign', 'Implants', 'Patient Forms', 'Book Appointment'],
    bodySample: 'Gentle family dental practice offering regular cleanings, teeth whitening, porcelain veneers, dental implants, Invisalign aligners, and periodontal therapy.',
  });
  const classDental = IndustryClassifier.classify(auditDental);
  recordResult(
    9,
    'Dental Practice (Dentistry & Orthodontics)',
    classDental.industry === 'Dental' &&
      classDental.confidence === 'HIGH',
    `Industry="${classDental.industry}", BusinessType="${classDental.businessType}", Confidence=${classDental.confidence}`
  );

  // 10. Healthcare & Medical Practice
  const auditHealth = createMockAuditJob({
    url: 'https://www.valleyfamilyhealthcenter.com',
    title: 'Valley Health Medical Clinic - Primary Care & Pediatric Physicians',
    metaDescription: 'Board-certified medical doctors providing primary healthcare, routine physical exams, urgent care, allergy testing, and chronic illness management.',
    headings: ['Primary Care Medicine & Family Physicians', 'Schedule a Doctor Consultation', 'Insurance & Telehealth Appointments'],
    navLinks: ['Primary Care', 'Pediatrics', 'Telehealth', 'Accepted Insurances', 'Patient Portal'],
    bodySample: 'Our outpatient medical clinic provides compassionate clinical care, preventative screenings, diagnostic lab tests, prescription management, and telehealth visits.',
  });
  const classHealth = IndustryClassifier.classify(auditHealth);
  recordResult(
    10,
    'Healthcare & Medical Clinic',
    classHealth.industry === 'Healthcare' &&
      classHealth.confidence === 'HIGH',
    `Industry="${classHealth.industry}", BusinessType="${classHealth.businessType}", Confidence=${classHealth.confidence}`
  );

  // 11. Fitness Center & Gym
  const auditGym = createMockAuditJob({
    url: 'https://www.ironpulsefitnessgym.com',
    title: 'Iron Pulse Fitness Club - 24/7 Gym, Personal Training & Group Classes',
    metaDescription: 'State of the art gym equipment, HIIT group workout classes, certified personal trainers, free weights, and flexible gym memberships.',
    headings: ['24/7 Gym Access & Modern Fitness Equipment', 'HIIT, Spin & Strength Training Classes', 'Claim Your Free 3-Day Pass'],
    navLinks: ['Gym Memberships', 'Class Schedule', 'Personal Trainers', 'Amenities', 'Free Pass'],
    bodySample: 'High-energy fitness facility with Olympic barbells, cardio machines, sauna, functional turf area, certified personal training coaching, and group fitness classes.',
  });
  const classGym = IndustryClassifier.classify(auditGym);
  recordResult(
    11,
    'Fitness & Wellness (Gym & Personal Training)',
    classGym.industry === 'Fitness & Wellness' &&
      classGym.confidence === 'HIGH',
    `Industry="${classGym.industry}", BusinessType="${classGym.businessType}", Confidence=${classGym.confidence}`
  );

  // 12. SaaS Platform
  const auditSaas = createMockAuditJob({
    url: 'https://www.cloudflowanalytics.io',
    title: 'CloudFlow Analytics - Real-time Data Pipeline & Observability Platform',
    metaDescription: 'Automate data streaming, API integrations, and cloud infrastructure monitoring. Start your free 14-day SaaS trial today.',
    headings: ['End-to-End Cloud Data Pipeline Automation', 'Integrate with 100+ Developer APIs', 'Simple Pricing Tiers for Growing Teams'],
    navLinks: ['Product Features', 'Integrations', 'Pricing Plans', 'Developer Docs', 'Start Free Trial'],
    bodySample: 'Scalable B2B SaaS software offering automated telemetry monitoring, cloud metrics ingestion, webhook event dispatching, SOC-2 compliant data retention, and transparent monthly subscription tiers.',
  });
  const classSaas = IndustryClassifier.classify(auditSaas);
  recordResult(
    12,
    'Technology / SaaS (Cloud Platform & Pricing Tiers)',
    classSaas.industry === 'Technology / SaaS' &&
      classSaas.confidence === 'HIGH',
    `Industry="${classSaas.industry}", BusinessType="${classSaas.businessType}", Confidence=${classSaas.confidence}`
  );

  // 13. E-commerce / Online Retailer
  const auditEcom = createMockAuditJob({
    url: 'https://www.nordicapparelco.com',
    title: 'Nordic Apparel Co - Sustainable Winter Jackets & Outdoor Gear',
    metaDescription: 'Shop premium waterproof outerwear, eco-friendly wool sweaters, and snow boots. Free worldwide shipping on orders over $100.',
    headings: ['New Winter Outerwear Collection', 'Shop Sustainable Wool Sweaters', 'Add to Cart & Secure Checkout'],
    navLinks: ['Women Jackets', 'Men Outerwear', 'Accessories', 'Shopping Cart', 'Track Order'],
    bodySample: 'Shop our catalog of eco-conscious winter apparel, waterproof jackets, insulated parkas, snow boots, 30-day hassle-free returns, secure stripe checkout, and customer reviews.',
  });
  const classEcom = IndustryClassifier.classify(auditEcom);
  recordResult(
    13,
    'E-commerce (Shopping Cart & Product Catalog)',
    classEcom.industry === 'E-commerce' &&
      classEcom.confidence === 'HIGH',
    `Industry="${classEcom.industry}", BusinessType="${classEcom.businessType}", Confidence=${classEcom.confidence}`
  );

  // 14. Professional Services (Consulting / Advisory)
  const auditProf = createMockAuditJob({
    url: 'https://www.vanguardadvisorygroup.com',
    title: 'Vanguard Advisory Group - Corporate Strategy & Management Consulting',
    metaDescription: 'Strategic management consulting, mergers and acquisitions advisory, organizational change management, and executive leadership coaching.',
    headings: ['Strategic Growth & Operational Efficiency Advisory', 'Mergers & Acquisitions Consulting', 'Schedule an Executive Consultation'],
    navLinks: ['Management Consulting', 'Advisory Services', 'Client Case Studies', 'Leadership Team', 'Inquire'],
    bodySample: 'We advise Fortune 500 executives and mid-market enterprises on operational transformation, corporate turnaround, M&A due diligence, change leadership, and organizational structure.',
  });
  const classProf = IndustryClassifier.classify(auditProf);
  recordResult(
    14,
    'Professional Services (Management Consulting & Advisory)',
    classProf.industry === 'Professional Services' &&
      classProf.confidence === 'HIGH',
    `Industry="${classProf.industry}", BusinessType="${classProf.businessType}", Confidence=${classProf.confidence}`
  );

  // 15. Unknown Generic Website (example.com with generic text)
  const auditUnknown = createMockAuditJob({
    url: 'https://www.example.com',
    title: 'Example Domain',
    metaDescription: 'This domain is for use in illustrative examples in documents.',
    headings: ['Example Domain'],
    navLinks: ['More Information'],
    bodySample: 'This domain is established to be used for illustrative examples in documents. You may use this domain in literature without prior coordination.',
  });
  const classUnknown = IndustryClassifier.classify(auditUnknown);
  const blueprintUnknown = BlueprintEngine.generate(classUnknown);
  recordResult(
    15,
    'Unknown Generic Website (Fallback & Verification Status)',
    classUnknown.industry === 'Unknown' &&
      classUnknown.confidence === 'UNKNOWN' &&
      classUnknown.provenance === 'INSUFFICIENT_EVIDENCE' &&
      classUnknown.verificationStatus === 'NOT VERIFIED' &&
      blueprintUnknown.statusLabel === 'GENERIC PROPOSAL — INDUSTRY NOT VERIFIED',
    `Industry="${classUnknown.industry}", Confidence=${classUnknown.confidence}, BlueprintStatus="${blueprintUnknown.statusLabel}"`
  );

  // 16. Parked Domain with Interior Design tokens only (aainteriordesignstudio.com)
  const auditParkedInteriorOnly = createMockAuditJob({
    url: 'http://aainteriordesignstudio.com/',
    title: '',
    metaDescription: '',
    headings: [],
    navLinks: [],
    bodySample: 'Domain parked or holding page.',
    isParked: true,
  });
  const classParkedInteriorOnly = IndustryClassifier.classify(auditParkedInteriorOnly);
  recordResult(
    16,
    'Parked Domain with Interior Design tokens only (No Architecture bleed)',
    classParkedInteriorOnly.industry === 'Interior & Architecture' &&
      classParkedInteriorOnly.businessType === 'Interior Design Studio' &&
      classParkedInteriorOnly.confidence === 'LOW' &&
      classParkedInteriorOnly.provenance === 'DOMAIN_TOKEN' &&
      classParkedInteriorOnly.verificationStatus === 'REQUIRES CLIENT APPROVAL',
    `Industry="${classParkedInteriorOnly.industry}", BusinessType="${classParkedInteriorOnly.businessType}", Provenance=${classParkedInteriorOnly.provenance}`
  );

  // 17. Parked Domain with Architecture Firm tokens only (modernarchitecturefirm.com)
  const auditParkedArchOnly = createMockAuditJob({
    url: 'https://www.modernarchitecturefirm.com',
    title: '',
    metaDescription: '',
    headings: [],
    navLinks: [],
    bodySample: 'Domain parked.',
    isParked: true,
  });
  const classParkedArchOnly = IndustryClassifier.classify(auditParkedArchOnly);
  recordResult(
    17,
    'Parked Domain with Architecture Firm tokens only',
    classParkedArchOnly.industry === 'Interior & Architecture' &&
      classParkedArchOnly.businessType === 'Architecture Firm' &&
      classParkedArchOnly.confidence === 'LOW' &&
      classParkedArchOnly.provenance === 'DOMAIN_TOKEN' &&
      classParkedArchOnly.verificationStatus === 'REQUIRES CLIENT APPROVAL',
    `Industry="${classParkedArchOnly.industry}", BusinessType="${classParkedArchOnly.businessType}", Provenance=${classParkedArchOnly.provenance}`
  );

  // 18. Parked Domain with BOTH Architecture + Interior tokens (architectureinteriorstudio.com)
  const auditParkedBothTokens = createMockAuditJob({
    url: 'https://www.architectureinteriorstudio.com',
    title: '',
    metaDescription: '',
    headings: [],
    navLinks: [],
    bodySample: 'Domain parked.',
    isParked: true,
  });
  const classParkedBothTokens = IndustryClassifier.classify(auditParkedBothTokens);
  recordResult(
    18,
    'Parked Domain with BOTH Architecture + Interior tokens',
    classParkedBothTokens.industry === 'Interior & Architecture' &&
      classParkedBothTokens.businessType === 'Architecture & Interior Studio' &&
      classParkedBothTokens.confidence === 'LOW' &&
      classParkedBothTokens.provenance === 'DOMAIN_TOKEN' &&
      classParkedBothTokens.verificationStatus === 'REQUIRES CLIENT APPROVAL',
    `Industry="${classParkedBothTokens.industry}", BusinessType="${classParkedBothTokens.businessType}", Provenance=${classParkedBothTokens.provenance}`
  );

  // 19. Actual Website with BOTH Architecture and Interior Content
  const auditLiveBoth = createMockAuditJob({
    url: 'https://www.modernspatialdesigns.com',
    title: 'Modern Spatial Studio - Architecture & Interior Design Practice',
    metaDescription: 'Comprehensive architecture planning, structural blueprints, residential interior design, room remodeling, and decor styling.',
    headings: ['Architecture Master Planning & Interior Remodeling', 'Commercial Buildings & Luxury Living Spaces'],
    navLinks: ['Architectural Projects', 'Interior Spaces', 'Remodeling', 'Contact'],
    bodySample: 'We provide full architecture and interior design services, combining building structural blueprints with custom luxury interior finishes and decor.',
  });
  const classLiveBoth = IndustryClassifier.classify(auditLiveBoth);
  recordResult(
    19,
    'Actual Website with BOTH Architecture & Interior Evidence (Content-Driven Blend)',
    classLiveBoth.industry === 'Interior & Architecture' &&
      classLiveBoth.businessType === 'Architecture & Interior Studio' &&
      classLiveBoth.confidence === 'MEDIUM' &&
      classLiveBoth.provenance === 'WEBSITE_EVIDENCE' &&
      classLiveBoth.verificationStatus === 'OBSERVED',
    `Industry="${classLiveBoth.industry}", BusinessType="${classLiveBoth.businessType}", Confidence=${classLiveBoth.confidence}`
  );

  // 20. Parked Domain with NO Useful Tokens (x192837.xyz)
  const auditParkedNoTokens = createMockAuditJob({
    url: 'https://www.x192837.xyz',
    title: '',
    metaDescription: '',
    headings: [],
    navLinks: [],
    bodySample: '',
    isParked: true,
  });
  const classParkedNoTokens = IndustryClassifier.classify(auditParkedNoTokens);
  recordResult(
    20,
    'Parked Domain with NO Useful Tokens',
    classParkedNoTokens.industry === 'Unknown' &&
      classParkedNoTokens.confidence === 'UNKNOWN' &&
      classParkedNoTokens.provenance === 'INSUFFICIENT_EVIDENCE' &&
      classParkedNoTokens.verificationStatus === 'NOT VERIFIED',
    `Industry="${classParkedNoTokens.industry}", Confidence=${classParkedNoTokens.confidence}, Provenance=${classParkedNoTokens.provenance}`
  );

  // 21. User-Provided Industry Override
  const auditUserOverride = createMockAuditJob({
    url: 'https://www.apexflightdynamics.com',
    industry: 'Aerospace Engineering',
    businessType: 'Commercial Aviation Systems',
    title: 'Apex Flight Dynamics - Turbine Components',
    bodySample: 'Manufacturing high performance aviation turbine blisks and aerospace navigation hardware.',
  });
  const classUserOverride = IndustryClassifier.classify(auditUserOverride);
  recordResult(
    21,
    'User-Provided Industry Override (Priority & High Confidence)',
    classUserOverride.industry === 'Aerospace Engineering' &&
      classUserOverride.businessType === 'Commercial Aviation Systems' &&
      classUserOverride.confidence === 'HIGH' &&
      classUserOverride.provenance === 'USER_PROVIDED' &&
      classUserOverride.verificationStatus === 'OBSERVED',
    `Industry="${classUserOverride.industry}", Provenance=${classUserOverride.provenance}`
  );

  // 22. Location Missing (Zero Template Leakage)
  const auditNoLoc = createMockAuditJob({
    url: 'https://www.citycoffeeroasters.com',
    title: 'City Coffee Roasters',
    bodySample: 'Fresh organic roasted coffee beans shipped worldwide.',
  });
  const salesNoLoc = SalesReportSynthesizer.synthesize(auditNoLoc);
  recordResult(
    22,
    'Location Missing (Proper Fallback Text & Provenance)',
    salesNoLoc.location === 'Target location was not provided.' &&
      salesNoLoc.locationProvenance === 'NOT_PROVIDED',
    `Location="${salesNoLoc.location}", Provenance=${salesNoLoc.locationProvenance}`
  );

  // 23. Location Provided by User
  const auditWithLoc = createMockAuditJob({
    url: 'https://www.citycoffeeroasters.com',
    location: 'Coimbatore, Tamil Nadu',
    title: 'City Coffee Roasters',
    bodySample: 'Fresh organic roasted coffee beans.',
  });
  const salesWithLoc = SalesReportSynthesizer.synthesize(auditWithLoc);
  recordResult(
    23,
    'Location Provided by User',
    salesWithLoc.location === 'Coimbatore, Tamil Nadu' &&
      salesWithLoc.locationProvenance === 'USER_PROVIDED',
    `Location="${salesWithLoc.location}", Provenance=${salesWithLoc.locationProvenance}`
  );

  // 24. Template Placeholder Leakage & Total Defensibility Check
  const sampleAudits = [auditInterior, auditArch, auditPump, auditSaas, auditParkedInteriorOnly, auditNoLoc, auditUnknown];
  let allClean = true;
  const forbidden = [
    'your area',
    'Your Business',
    'your service area',
    '[BUSINESS NAME]',
    '[LOCATION]',
    '{{business}}',
    '{{location}}',
  ];
  const leaksFound: string[] = [];

  for (const sample of sampleAudits) {
    const report = SalesReportSynthesizer.synthesize(sample);
    const json = JSON.stringify(report);
    for (const f of forbidden) {
      if (json.toLowerCase().includes(f.toLowerCase())) {
        allClean = false;
        leaksFound.push(`Leak of "${f}" in audit for ${sample.config.url}`);
      }
    }
  }

  recordResult(
    24,
    'Zero Template Placeholders & Commercial Integrity Across All Tests',
    allClean,
    leaksFound.length === 0 ? 'All reports completely sanitized' : leaksFound.join('; ')
  );

  console.log('\n================================================================');
  console.log(`📊 CLASSIFIER TEST RESULTS: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log('================================================================\n');

  if (results.some((r) => !r.passed)) {
    console.error('❌ One or more classification tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 ALL 24 UNIVERSAL CLASSIFICATION TEST CASES PASSED!');
  }
}

runClassificationTests().catch((err) => {
  console.error('\n❌ Fatal error in classification tests:', err);
  process.exit(1);
});
