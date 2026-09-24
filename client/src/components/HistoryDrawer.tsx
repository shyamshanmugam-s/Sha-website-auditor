import React from 'react';
import { X, Globe, Calendar, Trash2, ArrowRight, Layers, Clock } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  audits: any[];
  onSelectAudit: (id: string) => void;
  onDeleteAudit: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  audits,
  onSelectAudit,
  onDeleteAudit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-white">Past Website Audits</h3>
            <p className="text-xs text-slate-400">Audit history saved locally in auditStore.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {audits.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No previous audit jobs found.
            </div>
          ) : (
            audits.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectAudit(item.id);
                  onClose();
                }}
                className="group p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white truncate max-w-[240px]">
                    {item.businessName || item.url}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAudit(item.id);
                    }}
                    className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 font-mono truncate">{item.url}</div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>View Report</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
