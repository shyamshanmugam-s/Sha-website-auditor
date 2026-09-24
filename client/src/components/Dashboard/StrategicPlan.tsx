import React from 'react';
import { Sparkles, MapPin, Layers, ArrowRight, ShieldCheck, Palette, Zap } from 'lucide-react';

interface StrategicPlanProps {
  report: any;
}

export const StrategicPlan: React.FC<StrategicPlanProps> = ({ report }) => {
  const plan = report.priorityImprovementPlan || [];
  const sitemap = report.recommendedWebsiteStructure?.suggestedSitemap || [];
  const redesign = report.recommendedRedesignStrategy;
  const nextSteps = report.nextSteps || [];

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div className="space-y-6">
      {/* 1. Priority Improvement Plan */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Priority Improvement Plan</h3>
            <p className="text-xs text-slate-400">Ordered execution plan to address critical blockers first.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Recommended Action Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Effort</th>
                <th className="py-3 px-4">Strategic Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {plan.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        priorityColors[item.priority] || priorityColors['LOW']
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{item.action}</td>
                  <td className="py-3 px-4 capitalize text-slate-400">{item.category}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {item.effort} Effort
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{item.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Recommended Website Structure (Sitemap) */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recommended Website Architecture</h3>
            <p className="text-xs text-slate-400">
              High-converting sitemap blueprint designed for SEO depth and conversion.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sitemap.map((page: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{page.pageName}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {page.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400">{page.purpose}</p>
              {page.keySections && page.keySections.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Key Recommended Blocks:</div>
                  <div className="flex flex-wrap gap-1">
                    {page.keySections.map((sec: string, sIdx: number) => (
                      <span key={sIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
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

      {/* 3. Redesign Strategy & Tokens */}
      {redesign && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recommended Redesign Strategy</h3>
              <p className="text-xs text-slate-400">{redesign.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {redesign.corePillars?.map((pillar: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{pillar.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>

          {redesign.designTokensSuggestion && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Color Palette</span>
                <p className="text-slate-200">{redesign.designTokensSuggestion.colorPaletteRecommendation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Typography</span>
                <p className="text-slate-200">{redesign.designTokensSuggestion.typographyRecommendation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Layout Guidance</span>
                <p className="text-slate-200">{redesign.designTokensSuggestion.layoutGuidance}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Next Steps */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">Recommended Next Steps</h3>
        <div className="space-y-3">
          {nextSteps.map((step: any, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">
                {step.stepNumber}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{step.title}</h4>
                  <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {step.timelineRecommendation}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
