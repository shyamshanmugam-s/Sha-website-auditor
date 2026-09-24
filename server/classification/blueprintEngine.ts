import {
  IndustryClassification,
  SalesReportWebsiteStructure,
  ClassificationVerificationStatus,
} from '../types/audit.js';

export interface BlueprintResult {
  structure: SalesReportWebsiteStructure[];
  statusLabel: string;
  verificationStatus: ClassificationVerificationStatus;
}

export class BlueprintEngine {
  public static generate(classification: IndustryClassification, isParked: boolean = false): BlueprintResult {
    return this.generateBlueprint(classification, isParked);
  }

  /**
   * Generates a dynamic, commercially engineered 5-page sitemap blueprint
   * tailored to the classified industry, business type, target audience, and conversion goal.
   */
  public static generateBlueprint(classification: IndustryClassification, isParked: boolean = false): BlueprintResult {
    const industryLower = (classification.industry || '').toLowerCase();
    const bizTypeLower = (classification.businessType || '').toLowerCase();
    const isUnknown = classification.confidence === 'UNKNOWN' || industryLower === 'unknown';

    if (isUnknown) {
      return {
        structure: this.getGenericUnknownBlueprint(),
        statusLabel: 'GENERIC PROPOSAL — INDUSTRY NOT VERIFIED',
        verificationStatus: 'NOT VERIFIED',
      };
    }

    const verificationStatus: ClassificationVerificationStatus =
      classification.confidence === 'HIGH'
        ? 'OBSERVED'
        : classification.confidence === 'MEDIUM'
        ? 'INFERRED'
        : 'REQUIRES CLIENT APPROVAL';

    const statusLabel =
      classification.confidence === 'HIGH'
        ? 'STRATEGIC PROPOSAL (VERIFIED INDUSTRY)'
        : 'STRATEGIC PROPOSAL (PROPOSED / REQUIRES CLIENT APPROVAL)';

    // 1. Pump Manufacturing
    if (bizTypeLower.includes('pump')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Establish pump engineering authority, flow volume capacity, and industrial certifications.',
            keySections: ['Hero with 1-Click RFQ Trigger', 'Featured Pump Series Grid', 'Industrial Applications', 'ISO & Quality Standards', 'Direct Engineering Contact'],
            targetAudience: 'Procurement engineers, municipal water authorities, and plant operations directors.',
            conversionGoal: 'Request a technical specification sheet and submit an RFQ.',
          },
          {
            pageName: 'Pump Products & Curves',
            purpose: 'Comprehensive catalog of pump models, technical curves, head pressure charts, and material specs.',
            keySections: ['Filterable Pump Directory (Submersible / Centrifugal / Slurry)', 'Flow Rate & Head Pressure Tables', 'CAD / Datasheet Downloads'],
            targetAudience: 'Design engineers and equipment selectors.',
            conversionGoal: 'Download CAD drawing / datasheet.',
          },
          {
            pageName: 'Industrial Applications',
            purpose: 'Demonstrate domain experience across critical sectors (Mining, Municipal, Chemical, Agriculture).',
            keySections: ['Sector Case Studies', 'Heavy-Duty Operational Proof', 'Client OEM Endorsements'],
            targetAudience: 'Industry-specific plant managers.',
            conversionGoal: 'Explore application-specific pump configurations.',
          },
          {
            pageName: 'Quality, Testing & Facility',
            purpose: 'Showcase foundry capacity, hydrostatic testing rigs, and ISO quality credentials.',
            keySections: ['Hydrostatic Test Rig Specs', 'Quality Certifications (ISO 9001, CE)', 'Manufacturing Plant Virtual Tour'],
            targetAudience: 'Quality audit procurement committees.',
            conversionGoal: 'Verify manufacturing facility compliance.',
          },
          {
            pageName: 'Request a Quote (RFQ)',
            purpose: 'Streamlined technical specification upload and batch quote request pathway for engineers.',
            keySections: ['Operating Parameters Form (Flow / Head / Liquid)', 'CAD Drawing File Upload', 'Response Time Guarantee', 'Direct Sales Phone / Email'],
            targetAudience: 'Procurement buyers and sales engineers.',
            conversionGoal: 'Submit detailed pump RFQ.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 2. Manufacturing & Industrial
    if (industryLower.includes('manufacturing') || bizTypeLower.includes('manufacturer')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Establish engineering capabilities, production volume capacity, and quality certifications.',
            keySections: ['Hero with Instant RFQ Trigger', 'Core Manufacturing Capabilities', 'Industry Applications', 'Quality & ISO Standards', 'Direct Engineering Contact'],
            targetAudience: 'Procurement managers and industrial engineers.',
            conversionGoal: 'Submit CAD drawings or request a commercial RFQ.',
          },
          {
            pageName: 'Products & Capabilities',
            purpose: 'Comprehensive breakdown of machinery, materials, tolerances, and custom production services.',
            keySections: ['Machinery & Equipment List', 'Material Compatibility Guide', 'Tolerance Specifications', 'Quality Assurance Process'],
            targetAudience: 'Product engineers and technical buyers.',
            conversionGoal: 'Download capabilities matrix.',
          },
          {
            pageName: 'Applications & Industries',
            purpose: 'Demonstrate domain experience across target sectors (Automotive, Aerospace, Industrial, Consumer).',
            keySections: ['Industry-Specific Case Studies', 'Custom Component Showcases', 'Client OEM Endorsements'],
            targetAudience: 'Industry sector directors.',
            conversionGoal: 'Review sector-specific case studies.',
          },
          {
            pageName: 'About & Quality Standards',
            purpose: 'Showcase facility scale, engineering leadership, and ISO compliance credentials.',
            keySections: ['Facility Virtual Tour', 'Quality Certifications', 'Supply Chain Reliability', 'Company History'],
            targetAudience: 'Vendor onboarding teams.',
            conversionGoal: 'Validate vendor compliance.',
          },
          {
            pageName: 'Request a Quote (RFQ)',
            purpose: 'Streamlined technical specification upload and quote request pathway for procurement engineers.',
            keySections: ['CAD / Drawing File Upload Form', 'Quantity & Material Selectors', 'Response Time Guarantee', 'Direct Sales Phone / Email'],
            targetAudience: 'Procurement engineers.',
            conversionGoal: 'Submit RFQ.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 3. Interior Design
    if (bizTypeLower.includes('interior design') || (industryLower.includes('interior') && !bizTypeLower.includes('architecture firm'))) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Establish design authority, showcase signature transformations, and drive direct consultation inquiries.',
            keySections: ['Hero with Consultation Trigger', 'Featured Projects Showcase', 'Core Design Services Grid', 'Client Testimonials', 'Direct Contact Box'],
            targetAudience: 'Homeowners and commercial property owners seeking interior transformations.',
            conversionGoal: 'Book a design consultation.',
          },
          {
            pageName: 'Projects / Portfolio',
            purpose: 'Provide visual proof of spatial transformations filterable by room or project type.',
            keySections: ['Filterable Project Gallery (Residential / Commercial)', 'Before & After Highlights', 'Design Stories & Material Specifications'],
            targetAudience: 'Prospective clients evaluating aesthetic style.',
            conversionGoal: 'Browse project portfolio.',
          },
          {
            pageName: 'Services & Offerings',
            purpose: 'Provide a clear, transparent breakdown of design packages, deliverables, and step-by-step design process.',
            keySections: ['Design Capabilities Overview', 'Step-by-Step Process Timeline', 'Deliverables Checklist', 'Frequently Asked Questions'],
            targetAudience: 'Clients comparing service packages.',
            conversionGoal: 'Select a design service package.',
          },
          {
            pageName: 'About the Studio',
            purpose: 'Communicate design philosophy, showcase studio credentials, and introduce design leadership.',
            keySections: ['Studio Philosophy & Standards', 'Lead Designer Profiles', 'Quality Commitments', 'Press & Recognition'],
            targetAudience: 'Clients seeking designer credibility.',
            conversionGoal: 'Learn about the design team.',
          },
          {
            pageName: 'Contact & Consultation',
            purpose: 'Zero-friction contact channel for prospective clients to book consultations, call, or chat.',
            keySections: ['Consultation Request Form', 'Direct Phone & WhatsApp Links', 'Studio Location Map', 'Business Hours'],
            targetAudience: 'Ready-to-enquire clients.',
            conversionGoal: 'Submit consultation request.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 4. Architecture Firm
    if (bizTypeLower.includes('architecture')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Showcase architectural vision, landmark projects, and institutional credentials.',
            keySections: ['Hero with Landmark Architecture Reel', 'Featured Buildings & Masterplans', 'Practice Disciplines', 'Design Awards', 'Contact Link'],
            targetAudience: 'Commercial developers, institutions, and custom residential clients.',
            conversionGoal: 'Schedule architectural feasibility consultation.',
          },
          {
            pageName: 'Projects & Masterplans',
            purpose: 'Comprehensive architectural portfolio categorized by typology (Commercial, Civic, Residential).',
            keySections: ['Filterable Typology Gallery', 'Architectural Drawings & 3D Renderings', 'Sustainability & LEED Metrics'],
            targetAudience: 'Developers evaluating project scale.',
            conversionGoal: 'Review architectural case studies.',
          },
          {
            pageName: 'Practice & Expertise',
            purpose: 'Outline architectural disciplines, structural engineering coordination, and urban planning capabilities.',
            keySections: ['Architectural Services Matrix', 'BIM & 3D Modeling Workflow', 'Zoning & Permitting Advisory'],
            targetAudience: 'Institutional project managers.',
            conversionGoal: 'Request architectural RFP / proposal.',
          },
          {
            pageName: 'About & Leadership',
            purpose: 'Introduce principal architects, design ethos, publications, and sustainability commitment.',
            keySections: ['Principal Architect Bios', 'Design Ethos & Research', 'Awards & Monograph Publications'],
            targetAudience: 'Selection committees.',
            conversionGoal: 'Review partner profiles.',
          },
          {
            pageName: 'Contact & Project Inquiry',
            purpose: 'Direct communication portal for developer RFPs and architectural consultations.',
            keySections: ['Project Scope Inquiry Form', 'Global / Regional Office Locations', 'Direct Partner Contacts'],
            targetAudience: 'Developer procurement teams.',
            conversionGoal: 'Initiate project inquiry.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 5. Restaurant & Hospitality / Cafe / Bakery
    if (industryLower.includes('restaurant') || industryLower.includes('hospitality') || bizTypeLower.includes('cafe') || bizTypeLower.includes('bakery')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Create appetizing visual appeal, convey atmosphere, and provide 1-tap reservation and ordering triggers.',
            keySections: ['Hero Visual with Reserve Table CTA', 'Chef Specials Showcase', 'Dining Atmosphere Gallery', 'Customer Reviews', 'Location & Hours'],
            targetAudience: 'Local diners, food enthusiasts, and tourists.',
            conversionGoal: 'Reserve a table or order online.',
          },
          {
            pageName: 'Menu & Specials',
            purpose: 'Clear, mobile-friendly culinary menu with ingredient highlights and dietary options.',
            keySections: ['Categorized Food & Beverage Menu', 'Chef Signature Dishes', 'Dietary Tags (Vegetarian, Gluten-Free)', 'Pricing & Specials'],
            targetAudience: 'Diners reviewing options.',
            conversionGoal: 'Browse full menu.',
          },
          {
            pageName: 'Photo Gallery & Ambiance',
            purpose: 'High-resolution imagery of dishes, interior ambiance, private event spaces, and culinary artistry.',
            keySections: ['Interior Dining Room Photos', 'Signature Dish Closeups', 'Private Event Spaces'],
            targetAudience: 'Guests planning special meals.',
            conversionGoal: 'Explore visual ambiance.',
          },
          {
            pageName: 'Our Story & Heritage',
            purpose: 'Share culinary philosophy, chef background, and commitment to fresh local ingredients.',
            keySections: ['Chef & Founder Story', 'Local Ingredient Sourcing', 'Culinary Philosophy'],
            targetAudience: 'Diners seeking brand story.',
            conversionGoal: 'Learn about chef and philosophy.',
          },
          {
            pageName: 'Reservations & Contact',
            purpose: 'Instant table booking, direct phone calling, private event inquiries, and location map directions.',
            keySections: ['1-Click Table Booking Form', 'Direct Phone Dial', 'Private Event Request', 'Interactive Location Map'],
            targetAudience: 'Ready-to-dine customers.',
            conversionGoal: 'Complete table reservation.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 6. Dental Clinic & Orthodontics
    if (industryLower.includes('dental') || bizTypeLower.includes('dental') || bizTypeLower.includes('orthodont')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Alleviate patient anxiety, showcase smile transformations, and drive instant appointment bookings.',
            keySections: ['Hero with 1-Click Appointment Trigger', 'Smile Transformation Carousel', 'Core Dental Treatments', 'Patient Testimonials', 'Emergency Dental Box'],
            targetAudience: 'Patients and families seeking trusted dental care.',
            conversionGoal: 'Book dental consultation online.',
          },
          {
            pageName: 'Treatments & Services',
            purpose: 'Transparent breakdown of preventive, cosmetic, and restorative dental procedures.',
            keySections: ['General Dentistry', 'Cosmetic & Teeth Whitening', 'Dental Implants & Root Canals', 'Clear Aligners & Orthodontics'],
            targetAudience: 'Patients researching specific treatments.',
            conversionGoal: 'Select treatment and view details.',
          },
          {
            pageName: 'Smile Gallery & Proof',
            purpose: 'Before-and-after photo evidence of successful cosmetic and restorative dental treatments.',
            keySections: ['Before & After Smile Slider', 'Verified Patient Video Reviews', 'Case Studies'],
            targetAudience: 'Patients evaluating aesthetic results.',
            conversionGoal: 'Evaluate smile transformation proof.',
          },
          {
            pageName: 'Dentists & Clinic Technology',
            purpose: 'Build trust with dentist credentials, painless anesthesia methods, and 3D digital imaging.',
            keySections: ['Dentist Credentials & Education', 'Digital 3D X-Ray & Scanner Specs', 'Cleanliness & Sterilization Standards'],
            targetAudience: 'Anxious patients evaluating clinic standards.',
            conversionGoal: 'Learn about clinic safety and technology.',
          },
          {
            pageName: 'Book Appointment & Contact',
            purpose: 'Frictionless patient scheduling portal with insurance coverage information and clinic location map.',
            keySections: ['Online Appointment Scheduler', 'Accepted Insurance List', 'Direct Phone & Emergency Hotline', 'Clinic Map & Parking Info'],
            targetAudience: 'Ready-to-book patients.',
            conversionGoal: 'Confirm dental appointment.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 7. Healthcare & Medical
    if (industryLower.includes('healthcare') || bizTypeLower.includes('medical') || bizTypeLower.includes('hospital')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Provide reassuring medical authority, clear specialty navigation, and instant doctor booking.',
            keySections: ['Hero with Find a Doctor Search', 'Specialties Overview', 'Patient Care Standards', 'Emergency Care Hotline', 'Direct Appointment CTA'],
            targetAudience: 'Patients and families seeking medical diagnosis and care.',
            conversionGoal: 'Schedule doctor appointment.',
          },
          {
            pageName: 'Specialties & Departments',
            purpose: 'Comprehensive directory of medical specialties, diagnostic services, and treatment facilities.',
            keySections: ['Department Profiles', 'Diagnostic Imaging Capabilities', 'Surgical & Outpatient Services'],
            targetAudience: 'Patients seeking specialized medical treatment.',
            conversionGoal: 'Select medical specialty.',
          },
          {
            pageName: 'Doctors & Medical Staff',
            purpose: 'Credentialed profiles of physicians, surgeons, and specialists with appointment triggers.',
            keySections: ['Physician Bios & Board Certifications', 'Clinical Focus Areas', 'Direct Doctor Booking Buttons'],
            targetAudience: 'Patients selecting a physician.',
            conversionGoal: 'Book physician visit.',
          },
          {
            pageName: 'Patient & Visitor Resources',
            purpose: 'Essential information covering insurance plans, patient portal, admission guidelines, and billing.',
            keySections: ['Accepted Insurance Plans', 'Patient Portal Login', 'First Visit Checklist', 'Frequently Asked Questions'],
            targetAudience: 'Current and incoming patients.',
            conversionGoal: 'Access patient resources.',
          },
          {
            pageName: 'Appointments & Locations',
            purpose: 'Interactive clinic location maps, operating hours, emergency hotline, and scheduling portal.',
            keySections: ['Appointment Request Form', 'Direct Phone Hotline', 'Clinic Location Map & Directions'],
            targetAudience: 'Ready-to-visit patients.',
            conversionGoal: 'Confirm medical visit.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 8. Fitness & Gym
    if (industryLower.includes('fitness') || bizTypeLower.includes('gym')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Drive high-energy motivation, offer trial passes, and showcase training transformations.',
            keySections: ['Hero with Free Pass Trigger', 'Programs Overview Grid', 'Member Transformation Stories', 'Facility Amenities', 'Direct Join Button'],
            targetAudience: 'Fitness enthusiasts and individuals seeking healthy lifestyles.',
            conversionGoal: 'Claim 1-day free pass and join membership.',
          },
          {
            pageName: 'Programs & Classes',
            purpose: 'Detailed schedule and descriptions of training formats (Strength, HIIT, Cardio, Yoga).',
            keySections: ['Weekly Class Timetable', 'Program Intensity Levels', 'Personal Training Options'],
            targetAudience: 'Athletes and group class seekers.',
            conversionGoal: 'View class schedule.',
          },
          {
            pageName: 'Membership Plans',
            purpose: 'Transparent membership tier comparisons with zero hidden fees and direct sign-up pathways.',
            keySections: ['Tier Comparison Table', 'Included Amenities Checklist', 'No-Contract Options'],
            targetAudience: 'Prospective gym members.',
            conversionGoal: 'Select membership tier.',
          },
          {
            pageName: 'Coaches & Facility',
            purpose: 'Highlight certified trainers, modern equipment, recovery suites, and cleanliness standards.',
            keySections: ['Trainer Bios & Certifications', 'Facility Equipment Tour', 'Recovery & Locker Room Amenities'],
            targetAudience: 'Members seeking quality coaching.',
            conversionGoal: 'Explore training staff.',
          },
          {
            pageName: 'Free Trial & Location',
            purpose: 'Frictionless trial pass claim form, direct messaging, and gym location map.',
            keySections: ['Trial Pass Claim Form', 'Direct Phone & WhatsApp', 'Gym Operating Hours', 'Location Map'],
            targetAudience: 'New prospective visitors.',
            conversionGoal: 'Claim free trial pass.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 9. Technology / SaaS
    if (industryLower.includes('technology') || industryLower.includes('saas') || bizTypeLower.includes('saas') || bizTypeLower.includes('software')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Communicate software value proposition, highlight ROI, and drive instant free trial signups.',
            keySections: ['Hero with Start Free Trial Button', 'Interactive Product Feature Highlights', 'Customer ROI & Metrics', 'Integrations Ecosystem', 'Enterprise Security'],
            targetAudience: 'Tech leaders, developers, and business teams.',
            conversionGoal: 'Start free trial or book a live product demo.',
          },
          {
            pageName: 'Features & Capabilities',
            purpose: 'In-depth breakdown of software workflows, automation capabilities, and tech stack advantages.',
            keySections: ['Workflow Automation Showcase', 'API & Integration Directory', 'Security & Compliance (SOC2, GDPR)'],
            targetAudience: 'Technical evaluators.',
            conversionGoal: 'Explore product tour.',
          },
          {
            pageName: 'Pricing & Plans',
            purpose: 'Transparent tiered pricing model with monthly/annual toggle and feature comparison matrix.',
            keySections: ['Tier Comparison Table (Starter / Pro / Enterprise)', 'Feature Matrix Checklist', 'Enterprise Custom Quote Trigger'],
            targetAudience: 'Economic buyers and decision-makers.',
            conversionGoal: 'Choose a subscription plan.',
          },
          {
            pageName: 'Customer Case Studies',
            purpose: 'Data-driven customer success stories demonstrating efficiency gains and business results.',
            keySections: ['Industry Case Studies', 'Quantitative ROI Metrics', 'Customer Video Testimonials'],
            targetAudience: 'Prospective enterprise buyers.',
            conversionGoal: 'Read case studies.',
          },
          {
            pageName: 'Book a Demo & Contact',
            purpose: 'Zero-friction calendar scheduler to book live demonstrations with product architects.',
            keySections: ['Interactive Demo Booking Form', 'Direct Sales Chat Trigger', 'Documentation & Support Links'],
            targetAudience: 'Qualified sales prospects.',
            conversionGoal: 'Schedule product demo.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // 10. Real Estate
    if (industryLower.includes('real estate') || bizTypeLower.includes('realt')) {
      return {
        structure: [
          {
            pageName: 'Home',
            purpose: 'Engage property buyers and sellers with search filters, featured properties, and direct valuation triggers.',
            keySections: ['Property Search Hero', 'Featured Listings Showcase', 'Why Choose Our Agency', 'Client Success Stories', 'Direct Agent Contact'],
            targetAudience: 'Property buyers, sellers, and investors.',
            conversionGoal: 'Schedule property viewing or request valuation.',
          },
          {
            pageName: 'Featured Properties',
            purpose: 'Filterable property directory with photo galleries, virtual tours, and specification sheets.',
            keySections: ['Filter by Price, Location, Type', 'Interactive Floorplans & Video Tours', 'Schedule Private Showing Button'],
            targetAudience: 'Active home buyers.',
            conversionGoal: 'Book property showing.',
          },
          {
            pageName: 'Buyer & Seller Services',
            purpose: 'Explain advisory services, market valuation methods, and transaction guidance.',
            keySections: ['Home Valuation Tool', 'First-Time Buyer Guide', 'Marketing Strategy for Sellers'],
            targetAudience: 'Home sellers and first-time buyers.',
            conversionGoal: 'Request market valuation.',
          },
          {
            pageName: 'About Our Agency',
            purpose: 'Showcase local market knowledge, agent bios, and track record of completed transactions.',
            keySections: ['Agency Mission & Standards', 'Agent Profiles & Specialties', 'Neighborhood Market Reports'],
            targetAudience: 'Clients seeking trusted agent.',
            conversionGoal: 'Connect with an agent.',
          },
          {
            pageName: 'Contact & Schedule Showing',
            purpose: 'Rapid inquiry hub for property showings, listing consultations, and direct messaging.',
            keySections: ['Showing Request Form', 'WhatsApp Direct Agent Link', 'Office Location & Hours'],
            targetAudience: 'Ready-to-transact clients.',
            conversionGoal: 'Submit showing request.',
          },
        ],
        statusLabel,
        verificationStatus,
      };
    }

    // Default: General Commercial / Professional Services
    return {
      structure: [
        {
          pageName: 'Home',
          purpose: 'Clearly communicate unique value proposition, establish credibility, and drive consultation inquiries.',
          keySections: ['Hero with Consultation Trigger', 'Core Services Grid', 'Proof of Results / Client Logos', 'Testimonials', 'Direct Contact Box'],
          targetAudience: 'Commercial clients and prospective buyers.',
          conversionGoal: 'Request a consultation or quotation.',
        },
        {
          pageName: 'Services & Solutions',
          purpose: 'Provide a structured overview of capabilities, deliverables, and client onboarding process.',
          keySections: ['Detailed Service Cards', 'How We Work Process Timeline', 'Frequently Asked Questions'],
          targetAudience: 'Clients evaluating capabilities.',
          conversionGoal: 'Review service packages.',
        },
        {
          pageName: 'Case Studies & Results',
          purpose: 'Showcase measurable client outcomes and past projects to illustrate domain experience.',
          keySections: ['Featured Client Stories', 'Before & After Outcomes', 'Client Testimonials'],
          targetAudience: 'Prospective corporate buyers.',
          conversionGoal: 'Read client success stories.',
        },
        {
          pageName: 'About Us',
          purpose: 'Share company mission, standards of quality, and leadership background.',
          keySections: ['Our Mission & Standards', 'Leadership Bios', 'Why Clients Choose Us'],
          targetAudience: 'Clients evaluating company credibility.',
          conversionGoal: 'Learn about team credentials.',
        },
        {
          pageName: 'Contact & Inquiry',
          purpose: 'Provide a clear, zero-friction channel for visitors to call, message, or request consultations.',
          keySections: ['Simple Consultation Form', 'Direct Phone & WhatsApp Links', 'Business Hours & Location'],
          targetAudience: 'Ready-to-enquire clients.',
          conversionGoal: 'Submit inquiry form.',
        },
      ],
      statusLabel,
      verificationStatus,
    };
  }

  /**
   * Conservative generic blueprint for unidentifiable or generic websites.
   */
  public static getGenericUnknownBlueprint(): SalesReportWebsiteStructure[] {
    return [
      {
        pageName: 'Home',
        purpose: 'Establish business identity, communicate core offerings, and provide clear inquiry pathways.',
        keySections: ['Hero with Inquiry Trigger', 'Key Offerings Overview', 'Credibility & Trust Markers', 'Direct Contact Box'],
        targetAudience: 'Prospective visitors and commercial partners.',
        conversionGoal: 'Initiate direct contact.',
      },
      {
        pageName: 'About Us',
        purpose: 'Introduce the organization, company mission, and background.',
        keySections: ['Company Overview', 'Mission & Core Values', 'Leadership Background'],
        targetAudience: 'Visitors seeking organizational context.',
        conversionGoal: 'Learn about company background.',
      },
      {
        pageName: 'Services & Solutions',
        purpose: 'Structured breakdown of services, capabilities, and delivery methodology.',
        keySections: ['Service Capabilities Grid', 'Process Overview', 'Frequently Asked Questions'],
        targetAudience: 'Prospective buyers evaluating capabilities.',
        conversionGoal: 'Review offerings.',
      },
      {
        pageName: 'Case Studies & Insights',
        purpose: 'Demonstrate past work, client outcomes, and company insights.',
        keySections: ['Project Showcases', 'Client Endorsements', 'Insights & Updates'],
        targetAudience: 'Visitors seeking proof of work.',
        conversionGoal: 'Explore past project highlights.',
      },
      {
        pageName: 'Contact & Inquiry',
        purpose: 'Zero-friction channel for visitors to submit inquiries or contact the team.',
        keySections: ['Direct Inquiry Form', 'Phone & Email Channels', 'Business Hours'],
        targetAudience: 'Prospective clients.',
        conversionGoal: 'Submit general inquiry.',
      },
    ];
  }
}
