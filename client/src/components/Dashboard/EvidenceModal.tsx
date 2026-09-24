import React from 'react';
import { X, ShieldCheck, Database, Calendar, Link2, Activity } from 'lucide-react';

interface EvidenceModalProps {
  evidenceId: string | null;
  evidenceRegistry: any[];
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  evidenceId,
  evidenceRegistry,
  onClose,
}) => {
  if (!evidenceId) return null;

  const evidence = evidenceRegistry.find((e) => e.id === evidenceId);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold text-xs border border-cyan-500/30">
              {evidenceId}
            </span>
            <h3 className="text-sm font-bold text-white">Atomic Evidence Record</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {evidence ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Category</span>
                <span className="font-bold text-slate-200 capitalize">{evidence.category}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Verification Status</span>
                <span className="font-mono font-bold text-emerald-400">{evidence.status}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Evidence Type</span>
                <span className="font-mono text-slate-300">{evidence.type}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Logged At</span>
                <span className="text-slate-400">{new Date(evidence.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">Description</span>
              <p className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200">
                {evidence.description}
              </p>
            </div>

            {evidence.pageUrl && (
              <div>
                <span className="text-slate-400 font-bold block mb-1">Observed On Page URL</span>
                <p className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 font-mono text-[11px] text-cyan-400 truncate">
                  {evidence.pageUrl}
                </p>
              </div>
            )}

            {evidence.data && Object.keys(evidence.data).length > 0 && (
              <div>
                <span className="text-slate-400 font-bold block mb-1">Raw Evidence Data Payload</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                  {JSON.stringify(evidence.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Evidence record with ID {evidenceId} was not found.
          </div>
        )}
      </div>
    </div>
  );
};
