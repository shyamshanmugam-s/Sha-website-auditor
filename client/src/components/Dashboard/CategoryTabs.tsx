import React from 'react';
import {
  Sparkles,
  Layout,
  Smartphone,
  Search,
  Cpu,
  Gauge,
  Eye,
  FileText,
  Target,
  MapPin,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'visual'
  | 'ux'
  | 'mobile'
  | 'seo'
  | 'technical'
  | 'performance'
  | 'accessibility'
  | 'content'
  | 'conversion'
  | 'local_seo'
  | 'strategy'
  | 'pages';

interface CategoryTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  findingsCountByCategory: Record<string, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onTabChange,
  findingsCountByCategory,
}) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; countKey?: string }> = [
    { id: 'overview', label: 'All Findings', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'visual', label: 'Visual Design', icon: <Layout className="w-4 h-4" />, countKey: 'visual' },
    { id: 'ux', label: 'UX & Navigation', icon: <Compass className="w-4 h-4" />, countKey: 'ux' },
    { id: 'mobile', label: 'Mobile Viewport', icon: <Smartphone className="w-4 h-4" />, countKey: 'mobile' },
    { id: 'seo', label: 'SEO Signals', icon: <Search className="w-4 h-4" />, countKey: 'seo' },
    { id: 'technical', label: 'Technical & Security', icon: <Cpu className="w-4 h-4" />, countKey: 'technical' },
    { id: 'performance', label: 'Performance', icon: <Gauge className="w-4 h-4" />, countKey: 'performance' },
    { id: 'accessibility', label: 'Accessibility', icon: <Eye className="w-4 h-4" />, countKey: 'accessibility' },
    { id: 'content', label: 'Content Depth', icon: <FileText className="w-4 h-4" />, countKey: 'content' },
    { id: 'conversion', label: 'Conversion Funnel', icon: <Target className="w-4 h-4" />, countKey: 'conversion' },
    { id: 'local_seo', label: 'Local Visibility', icon: <MapPin className="w-4 h-4" />, countKey: 'local_seo' },
    { id: 'strategy', label: 'Strategic Plan', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'pages', label: 'Pages Inspected', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-800 no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = tab.countKey ? findingsCountByCategory[tab.countKey] || 0 : 0;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-850'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
