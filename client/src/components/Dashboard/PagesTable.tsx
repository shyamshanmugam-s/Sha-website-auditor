import React from 'react';
import { ExternalLink, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface PagesTableProps {
  pages: any[];
}

export const PagesTable: React.FC<PagesTableProps> = ({ pages }) => {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Inspected Web Pages</h3>
          <p className="text-xs text-slate-400">
            Total {pages.length} pages crawled within priority limits.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Page URL</th>
              <th className="py-3 px-4">Page Title</th>
              <th className="py-3 px-4">Response Time</th>
              <th className="py-3 px-4">Errors / Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {pages.map((p, idx) => {
              const isSuccess = p.statusCode >= 200 && p.statusCode < 400;
              const hasErrors = p.consoleErrors.length > 0 || p.networkErrors.length > 0;

              return (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{p.statusCode || 'ERR'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate font-medium text-white">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                    >
                      <span className="truncate">{p.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
                    </a>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                    {p.title || '<No Title Declared>'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                    {p.responseTimeMs}ms
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {hasErrors ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {p.consoleErrors.length} JS / {p.networkErrors.length} Net
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Clean</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
