import React, { useState } from 'react';
import { Download, FileText, Code, Check, Sparkles, Shield } from 'lucide-react';

interface ExportBarProps {
  auditId: string;
  audit: any;
}

export const ExportBar: React.FC<ExportBarProps> = ({ auditId, audit }) => {
  const [downloadingJson, setDownloadingJson] = useState(false);

  const handleDownloadClientPdf = () => {
    window.open(`/api/audit/${auditId}/pdf?mode=client`, '_blank');
  };

  const handleDownloadInternalPdf = () => {
    window.open(`/api/audit/${auditId}/pdf?mode=internal`, '_blank');
  };

  const handleDownloadJson = () => {
    setDownloadingJson(true);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SHA-Audit-${audit.config.businessName || 'Report'}-${auditId.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => setDownloadingJson(false), 1000);
  };

  const handleDownloadSalesPdf = () => {
    window.open(`/api/audit/${auditId}/sales-pdf`, '_blank');
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl glass-panel-glow border border-slate-800 bg-slate-900/90 shadow-xl">
      <div className="flex items-center gap-2.5 text-xs text-slate-300">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-extrabold text-white text-sm block">SHA WebStudio Export Center</span>
          <span className="text-slate-400 text-[11px]">Client Sales, Technical Reports & Raw Telemetry</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <button
          onClick={handleDownloadJson}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer shadow-sm"
          title="Download complete telemetry & evidence tree in JSON format"
        >
          {downloadingJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-slate-400" />}
          <span>Export JSON</span>
        </button>

        <button
          onClick={handleDownloadInternalPdf}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
          title="Download full technical telemetry, raw evidence IDs, headers, and console errors"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Internal Technical PDF</span>
        </button>

        <button
          onClick={handleDownloadClientPdf}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer shadow-sm"
          title="Download executive client report with business impact and opportunities"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Client Technical PDF</span>
        </button>

        <button
          onClick={handleDownloadSalesPdf}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.99]"
          title="Download executive 2-4 page Client Sales PDF report"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Download Sales PDF</span>
        </button>
      </div>
    </div>
  );
};
