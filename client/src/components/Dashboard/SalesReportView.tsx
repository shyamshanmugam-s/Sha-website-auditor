import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Briefcase,
  HelpCircle,
  ExternalLink,
  MapPin,
  Globe,
  Monitor
} from 'lucide-react';
import { ScreenshotViewer } from './ScreenshotViewer.js';

interface SalesReportViewProps {
  salesReport: any;
  audit: any;
  onViewEvidence: (evidenceId: string) => void;
}

export const SalesReportView: React.FC<SalesReportViewProps> = ({
  salesReport,
  audit,
  onViewEvidence,
}) => {
  if (!salesReport) {
    return (
      <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
        <p className="text-sm font-semibold">Compiling Client Commercial Strategy...</p>
      </div>
    );
  }

  const priorityStyles: Record<string, { badge: string; border: string }> = {
    CRITICAL: { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', border: 'border-rose-500/40' },
    HIGH: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', border: 'border-amber-500/40' },
    MEDIUM: { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40', border: 'border-sky-500/40' },
    LOW: { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40', border: 'border-slate-500/40' },
  };

  const homePage = audit?.pages?.[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Executive Sales Header & Status Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-slate-800 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 relative overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tracking-wide">
              CLIENT SALES AUDIT
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-bold text-slate-300 flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>{salesReport.businessType || salesReport.industry}</span>
              {salesReport.businessType && salesReport.businessType !== salesReport.industry && salesReport.businessType !== 'Unknown Business Type' && (
                <span className="text-[10px] text-slate-400">({salesReport.industry})</span>
              )}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                salesReport.industryConfidence === 'HIGH' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                salesReport.industryConfidence === 'MEDIUM' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                salesReport.industryConfidence === 'LOW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-slate-700 text-slate-400'
              }`}>
                {salesReport.industryConfidence} CONFIDENCE
              </span>
              {salesReport.classificationProvenance && (
                <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 uppercase tracking-wider">
                  {salesReport.classificationProvenance.replace(/_/g, ' ')}
                </span>
              )}
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <span>Audit Date:</span>
            <span className="text-slate-200 font-bold">
              {new Date(audit.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-2.5">
          Website Commercial Strategy & Growth Audit
        </h2>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mb-6">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-cyan-300">{audit.config?.url}</span>
          </div>
          {salesReport.businessName && salesReport.businessName !== 'Business name not provided' && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-200 font-bold">{salesReport.businessName}</span>
              {salesReport.businessNameProvenance === 'INFERRED FROM DOMAIN' && (
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  INFERRED FROM DOMAIN
                </span>
              )}
              {salesReport.businessNameProvenance === 'INFERRED FROM WEBSITE' && (
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  INFERRED FROM WEBSITE
                </span>
              )}
            </div>
          )}
          {salesReport.location && salesReport.location !== 'Target location was not provided.' ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{salesReport.location}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Target location was not provided.</span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mb-6">
          A concise, business-first review of digital credibility, visitor conversion pathways, local market discovery, and high-impact website improvements.
        </p>

        {/* Website Status Callout */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border ${
            salesReport.isParkedOrIncomplete
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          } flex items-start gap-3.5 shadow-inner`}
        >
          {salesReport.isParkedOrIncomplete ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider">
              {salesReport.isParkedOrIncomplete
                ? '⚠️ Current Status: Holding / Under-Construction Domain'
                : '✅ Current Status: Live Active Web Presence'}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {salesReport.websiteStatusSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Viewport Screenshots */}
      {(homePage?.desktopScreenshot || homePage?.mobileScreenshot) && (
        <ScreenshotViewer
          desktopScreenshot={homePage?.desktopScreenshot}
          mobileScreenshot={homePage?.mobileScreenshot}
          url={audit.config?.url}
        />
      )}

      {/* 3. What Is Working (Validated Strengths) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            1. What Is Currently Working (Verified Strengths)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salesReport.whatIsWorking?.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl glass-panel border border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.title}</span>
                </strong>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.status}
                  </span>
                  {item.evidenceIds?.map((eid: string) => (
                    <button
                      key={eid}
                      onClick={() => onViewEvidence(eid)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                      title="Inspect atomic evidence"
                    >
                      {eid}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Top High-Impact Opportunities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              2. Top High-Impact Commercial Opportunities
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            Ranked by Business & UX Impact
          </span>
        </div>

        <div className="space-y-4">
          {salesReport.topOpportunities?.map((opp: any, idx: number) => {
            const style = priorityStyles[opp.priority] || priorityStyles.MEDIUM;
            return (
              <div
                key={opp.id}
                className={`p-5 sm:p-6 rounded-2xl glass-panel border ${style.border} bg-slate-900/80 hover:bg-slate-900 transition-all space-y-3.5 shadow-lg`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-black text-cyan-400 border border-slate-700">
                      {idx + 1}
                    </span>
                    <span>{opp.title}</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style.badge}`}>
                      {opp.priority}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {opp.status}
                    </span>
                    {opp.evidenceIds?.map((eid: string) => (
                      <button
                        key={eid}
                        onClick={() => onViewEvidence(eid)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 hover:text-cyan-200 border border-cyan-500/30 transition-colors cursor-pointer"
                        title="View underlying evidence"
                      >
                        {eid}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Current Observation</span>
                    <p className="text-slate-300 leading-relaxed">{opp.clientObservation}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="font-bold text-amber-400 block uppercase tracking-wider text-[10px]">Business Consequence</span>
                    <p className="text-slate-300 leading-relaxed">{opp.businessImpact}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-2.5 shadow-inner">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-cyan-200 leading-relaxed">
                    <strong className="text-cyan-300 font-bold">Recommended Action: </strong>
                    <span>{opp.recommendedAction}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Why These Opportunities Matter & Dynamic Industry Blueprint */}
      <div className="space-y-4">
        <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 shadow-lg">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Why These Improvements Matter to Your Bottom Line</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {salesReport.whyTheseMatter}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            3. Recommended 5-Page Website Blueprint ({salesReport.industry})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesReport.recommendedStructure?.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/70 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-sm font-bold text-white">{item.pageName}</strong>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    salesReport.structureStatus?.includes('NOT VERIFIED')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {salesReport.structureStatus || 'PROPOSED / REQUIRES CLIENT APPROVAL'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {item.purpose}
                </p>
              </div>

              {item.keySections && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Recommended Sections
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.keySections.map((sec: string, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Phased Implementation Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            4. Phased Implementation Roadmap
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salesReport.implementationRoadmap?.map((phase: any, idx: number) => (
            <div
              key={idx}
              className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 space-y-2.5 relative shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">{phase.timeframe}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Phase {idx + 1}
                </span>
              </div>
              <strong className="text-sm font-bold text-white block">{phase.title}</strong>
              <p className="text-xs text-slate-300 leading-relaxed">{phase.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. SHA WebStudio Consultative Next Steps Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            SHA WebStudio • Client Strategy
          </span>
        </div>
        <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {salesReport.agencyCta?.title}
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          {salesReport.agencyCta?.message}
        </p>
        <div className="pt-2 flex items-center gap-3">
          <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center gap-2 shadow-xl shadow-cyan-500/25">
            <span>{salesReport.agencyCta?.contactPrompt}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
