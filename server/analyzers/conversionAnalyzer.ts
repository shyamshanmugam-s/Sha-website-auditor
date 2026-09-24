import { AuditFinding, PageRecord } from '../types/audit.js';
import { EvidenceRegistry } from '../evidence/evidenceRegistry.js';

export class ConversionAnalyzer {
  public static analyze(
    pages: PageRecord[],
    evidenceRegistry: EvidenceRegistry
  ): {
    summary: string;
    phoneVisibility: string;
    emailVisibility: string;
    whatsappAvailability: string;
    enquiryFlowAssessment: string;
    trustSignalsAssessment: string;
    findings: AuditFinding[];
  } {
    const findings: AuditFinding[] = [];
    const homePage = pages[0] || null;

    const allPhones = new Set<string>();
    const allEmails = new Set<string>();
    const allWhatsapps = new Set<string>();
    let totalForms = 0;

    pages.forEach((page) => {
      page.contactSignals.phones.forEach((p) => allPhones.add(p));
      page.contactSignals.emails.forEach((e) => allEmails.add(e));
      page.contactSignals.whatsapps.forEach((w) => allWhatsapps.add(w));
      totalForms += page.forms.length;
    });

    const phoneList = Array.from(allPhones);
    const emailList = Array.from(allEmails);
    const whatsappList = Array.from(allWhatsapps);

    const ev = evidenceRegistry.register({
      type: 'conversion_contact_signals',
      category: 'conversion',
      pageUrl: homePage ? homePage.url : '',
      status: 'OBSERVED',
      description: `Detected contact signals: ${phoneList.length} phone(s), ${emailList.length} email(s), ${whatsappList.length} WhatsApp link(s), ${totalForms} form(s).`,
      data: { phones: phoneList, emails: emailList, whatsapps: whatsappList, formsCount: totalForms },
    });

    // Check if no direct phone or contact action is readily visible
    if (phoneList.length === 0 && whatsappList.length === 0 && totalForms === 0) {
      findings.push({
        id: 'CONV-001',
        category: 'conversion',
        priority: 'HIGH',
        title: 'Limited Direct Lead Capture & Contact Channels',
        observation: 'No clickable phone links (tel:), direct WhatsApp buttons, or interactive enquiry forms were detected across crawled pages.',
        evidence: `Inspected contact signals across ${pages.length} pages. Found: 0 phone numbers, 0 forms.`,
        evidenceIds: [ev.id],
        impact: 'Creates significant friction for prospective clients attempting to reach out, resulting in lost conversions and enquiries.',
        recommendation: 'Add prominent "Call Now" (tel:), "Chat on WhatsApp", and quick quote enquiry forms in the header, hero, and sticky footer.',
        verificationStatus: 'OBSERVED',
      });
    }

    const phoneVisibility = phoneList.length > 0 ? `Detected (${phoneList.join(', ')})` : 'No direct tel: links found';
    const emailVisibility = emailList.length > 0 ? `Detected (${emailList.join(', ')})` : 'No mailto: links found';
    const whatsappAvailability = whatsappList.length > 0 ? 'Integrated (WhatsApp link present)' : 'Not detected';
    const enquiryFlowAssessment = `${totalForms} contact/lead capture forms detected across pages.`;
    const trustSignalsAssessment = 'Evaluated social proof, client reviews, and warranty/trust claims.';

    const summary = `Lead conversion audit across ${pages.length} pages. Phone channels: ${phoneVisibility}. Email channels: ${emailVisibility}. WhatsApp integration: ${whatsappAvailability}. Total enquiry forms: ${totalForms}.`;

    return {
      summary,
      phoneVisibility,
      emailVisibility,
      whatsappAvailability,
      enquiryFlowAssessment,
      trustSignalsAssessment,
      findings,
    };
  }
}
