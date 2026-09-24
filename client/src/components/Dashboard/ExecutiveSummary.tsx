import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2, Globe, Clock, Layers } from 'lucide-react';

interface ExecutiveSummaryProps {
  report: any;
  audit: any;
  onFilterPriority: (priority: string | null) => void;
  selectedPriority: string | null;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  report,
  audit,
  onFilterPriority,
  selectedPriority,
}) => {
  const counts = report.executiveSummary.findingsCountByPriority;
  const condition = report.executiveSummary.overallCondition;

  const conditionColorMap: Record<string, { bg: string; text: string; border: string }> = {
    'Excellent': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'Good': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    'Needs Attention': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    'Critical Issues': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const condStyle = conditionColorMap[condition] || conditionColorMap['Good'];

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Target Website</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}>
                {condition}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white flex items-center gap-2">
              <span>{audit.config.businessName || new URL(audit.config.url).hostname}</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">{audit.config.url}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Pages Inspected</span>
              </div>
              <div className="text-base font-bold text-white mt-0.5">{report.websiteOverview.totalPagesCrawled}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Audit Duration</span>
              </div>
              <div className="text-base font-bold text-white mt-0.5">{report.websiteOverview.auditDurationSec}s</div>
            </div>

            {audit.config.location && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Target Location</div>
                <div className="text-base font-bold text-white mt-0.5">{audit.config.location}</div>
              </div>
            )}
          </div>
        </div>

        {/* Priority Counts Cards (Transparent Findings Breakdown) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <button
            onClick={() => onFilterPriority(selectedPriority === 'CRITICAL' ? null : 'CRITICAL')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPriority === 'CRITICAL'
                ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                : 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Critical Issues</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-heading font-extrabold text-rose-300 mt-2">{counts.CRITICAL}</div>
            <div className="text-[10px] text-rose-400/80 mt-1">Requires immediate remediation</div>
          </button>

          <button
            onClick={() => onFilterPriority(selectedPriority === 'HIGH' ? null : 'HIGH')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPriority === 'HIGH'
                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-amber-950/20 border-amber-900/40 hover:bg-amber-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">High Priority</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-heading font-extrabold text-amber-300 mt-2">{counts.HIGH}</div>
            <div className="text-[10px] text-amber-400/80 mt-1">Significant conversion or SEO impact</div>
          </button>

          <button
            onClick={() => onFilterPriority(selectedPriority === 'MEDIUM' ? null : 'MEDIUM')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPriority === 'MEDIUM'
                ? 'bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/30'
                : 'bg-yellow-950/20 border-yellow-900/40 hover:bg-yellow-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">Medium Priority</span>
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-3xl font-heading font-extrabold text-yellow-300 mt-2">{counts.MEDIUM}</div>
            <div className="text-[10px] text-yellow-400/80 mt-1">UX & structural optimization</div>
          </button>

          <button
            onClick={() => onFilterPriority(selectedPriority === 'LOW' ? null : 'LOW')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPriority === 'LOW'
                ? 'bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-500/30'
                : 'bg-cyan-950/20 border-cyan-900/40 hover:bg-cyan-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Low / Polish</span>
              <Info className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-heading font-extrabold text-cyan-300 mt-2">{counts.LOW}</div>
            <div className="text-[10px] text-cyan-400/80 mt-1">Refinements & best practices</div>
          </button>
        </div>

        {/* Executive Summary Text */}
        <div className="mt-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Executive Strategic Overview</h4>
            <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">Client-Ready Synthesis</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {report.clientSummary?.overview || report.executiveSummary.summary}
          </p>
        </div>

        {/* Top 5 Improvement Opportunities (Jargon-free business impact) */}
        {report.clientSummary?.top5Opportunities && report.clientSummary.top5Opportunities.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top 5 Growth & Conversion Opportunities</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {report.clientSummary.top5Opportunities.map((opp: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-cyan-500/30 transition-all">
                  <div className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono font-bold">
                      {idx + 1}
                    </span>
                    <span>{opp.title}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <strong className="text-slate-400">Business Impact: </strong>
                    <span>{opp.businessImpact}</span>
                  </div>
                  <div className="text-xs text-cyan-200 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-800/30">
                    <strong className="text-cyan-400">Recommended Action: </strong>
                    <span>{opp.recommendedAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Risks Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Strengths & Assets</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(report.clientSummary?.currentStrengths || report.executiveSummary.topStrengths).map((str: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-2.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Primary Strategic Risks</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {report.executiveSummary.topRisks.map((risk: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-400">!</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
