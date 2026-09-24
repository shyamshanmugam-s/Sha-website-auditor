import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface FindingsSectionProps {
  findings: any[];
  selectedPriority: string | null;
  onSelectPriority: (priority: string | null) => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const FindingsSection: React.FC<FindingsSectionProps> = ({
  findings,
  selectedPriority,
  onSelectPriority,
  onViewEvidence,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const expandAll = () => {
    setExpandedIds(new Set(findings.map((f) => f.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Filter findings
  const filtered = findings.filter((f) => {
    if (selectedPriority && f.priority !== selectedPriority) return false;
    if (selectedStatus && f.verificationStatus !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.observation.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
    HIGH: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    LOW: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  };

  const statusColors: Record<string, string> = {
    OBSERVED: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    TESTED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    INFERRED: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'NOT VERIFIED': 'bg-slate-800 text-slate-400 border border-slate-700',
    'NOT APPLICABLE': 'bg-slate-900 text-slate-500 border border-slate-800',
  };

  return (
    <div className="space-y-4">
      {/* Controls / Filter Bar */}
      <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search findings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onSelectPriority(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                !selectedPriority ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Priorities
            </button>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => onSelectPriority(selectedPriority === p ? null : p)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedPriority === p
                    ? `${priorityColors[p].bg} ${priorityColors[p].text}`
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Verification Status Filter */}
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Verification Statuses</option>
            <option value="OBSERVED">OBSERVED</option>
            <option value="TESTED">TESTED</option>
            <option value="INFERRED">INFERRED</option>
            <option value="NOT VERIFIED">NOT VERIFIED</option>
            <option value="NOT APPLICABLE">NOT APPLICABLE</option>
          </select>

          {/* Expand/Collapse */}
          <div className="flex gap-1 ml-auto">
            <button
              onClick={expandAll}
              className="px-2 py-1 rounded text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 rounded text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
          No findings match the selected filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((finding) => {
            const isExpanded = expandedIds.has(finding.id);
            const pStyle = priorityColors[finding.priority] || priorityColors['LOW'];
            const sStyle = statusColors[finding.verificationStatus] || statusColors['OBSERVED'];

            return (
              <div
                key={finding.id}
                className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(finding.id)}
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                        {finding.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${sStyle}`}>
                        {finding.verificationStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {finding.category}
                      </span>
                      {finding.evidenceIds && finding.evidenceIds.length > 0 && (
                        <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                          {finding.evidenceIds.map((eid: string) => (
                            <button
                              key={eid}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewEvidence(eid);
                              }}
                              className="px-1.5 py-0.2 rounded bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 hover:underline"
                            >
                              {eid}
                            </button>
                          ))}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">{finding.title}</h4>
                    {!isExpanded && (
                      <p className="text-xs text-slate-400 line-clamp-1">{finding.observation}</p>
                    )}
                  </div>

                  <button className="text-slate-500 hover:text-slate-300 p-1 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-850 space-y-3 text-xs bg-slate-950/40">
                    <div>
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                        Observation
                      </div>
                      <p className="text-slate-200">{finding.observation}</p>
                    </div>

                    {finding.evidence && (
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-line">
                        <span className="text-slate-500 font-sans font-bold block mb-1">Technical Evidence:</span>
                        {finding.evidence}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30">
                        <div className="font-bold text-rose-400 uppercase tracking-wider text-[10px] mb-1">
                          Potential Impact
                        </div>
                        <p className="text-slate-300">{finding.impact}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                        <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] mb-1">
                          Actionable Recommendation
                        </div>
                        <p className="text-slate-300">{finding.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
