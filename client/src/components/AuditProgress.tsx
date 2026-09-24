import React from 'react';
import { Loader2, CheckCircle2, XCircle, Ban, AlertCircle, Sparkles, Shield, Eye, Gauge, FileText } from 'lucide-react';

interface AuditProgressProps {
  progressPercent: number;
  message: string;
  status: string;
  url: string;
  onCancel: () => void;
  error?: string | null;
}

export const AuditProgress: React.FC<AuditProgressProps> = ({
  progressPercent,
  message,
  status,
  url,
  onCancel,
  error,
}) => {
  const steps = [
    { name: 'SSRF & Domain Pre-flight Validation', desc: 'Verifying network isolation and DNS health', icon: Shield, minPercent: 5 },
    { name: 'Multi-Page Crawl & Dual-Viewport Capture', desc: 'Scanning DOM, forms, links, and rendering screenshots', icon: Eye, minPercent: 15 },
    { name: 'Core Web Vitals & Performance Audit', desc: 'Evaluating FCP, LCP, CLS, and page load telemetry', icon: Gauge, minPercent: 70 },
    { name: 'Strategic AI & Commercial Synthesis', desc: 'Selecting top opportunities and dynamic industry blueprint', icon: Sparkles, minPercent: 85 },
    { name: 'Client Sales & Technical PDF Generation', desc: 'Compiling executive and engineering report documents', icon: FileText, minPercent: 95 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto glass-panel-glow rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 animate-fadeIn relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            {status === 'failed' ? (
              <XCircle className="w-6 h-6 text-rose-400" />
            ) : status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            )}
          </div>
          <div>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
              {status === 'failed'
                ? 'Audit Interrupted'
                : status === 'completed'
                ? 'Audit Completed'
                : 'Auditing Website in Progress'}
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-sm sm:max-w-md mt-0.5">{url}</p>
          </div>
        </div>

        {status !== 'completed' && status !== 'failed' && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-all cursor-pointer shadow-sm"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Cancel Audit</span>
          </button>
        )}
      </div>

      {/* Progress Bar with Dynamic Glowing Indicator */}
      <div className="space-y-2.5 relative z-10">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            {message || 'Executing audit pipeline...'}
          </span>
          <span className="text-cyan-400 font-mono font-bold text-sm">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-500 rounded-full shadow-lg shadow-cyan-500/50"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Real-Time Step Milestones */}
      <div className="space-y-3 relative z-10">
        {steps.map((step, idx) => {
          const isDone = progressPercent > step.minPercent + 10;
          const isCurrent = progressPercent >= step.minPercent && progressPercent <= step.minPercent + 15;
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 rounded-2xl text-xs transition-all ${
                isCurrent
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 shadow-md shadow-cyan-500/5'
                  : isDone
                  ? 'bg-slate-900/60 border border-slate-800/70 text-slate-300'
                  : 'bg-slate-950/40 border border-slate-900/60 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-extrabold'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-800'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <div>
                  <div className={`text-xs ${isCurrent ? 'font-bold text-white' : isDone ? 'font-semibold text-slate-200' : 'font-medium'}`}>
                    {step.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{step.desc}</div>
                </div>
              </div>

              <div>
                {isDone && <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Completed</span>}
                {isCurrent && <span className="text-cyan-400 font-mono font-bold animate-pulse px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">In Progress...</span>}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-400 text-sm">Audit Processing Error</div>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
