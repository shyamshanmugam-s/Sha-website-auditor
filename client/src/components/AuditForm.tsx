import React, { useState } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Sliders,
  ArrowRight,
  Zap,
  TrendingUp,
  Smartphone,
  Gauge,
  Compass,
  ShieldCheck,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { CreateAuditParams } from '../services/api.js';

interface AuditFormProps {
  onSubmit: (params: CreateAuditParams) => void;
  isLoading: boolean;
}

export const AuditForm: React.FC<AuditFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [maxPages, setMaxPages] = useState(15);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter a website URL to begin audit.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError('Please enter a valid website URL (e.g. https://example.com)');
      return;
    }

    onSubmit({
      url: cleanUrl,
      businessName: businessName.trim() || undefined,
      location: location.trim() || undefined,
      maxPages,
    });
  };

  const handleQuickPreset = (presetUrl: string, name?: string, loc?: string) => {
    setUrl(presetUrl);
    if (name) setBusinessName(name);
    if (loc) setLocation(loc);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-fadeIn py-2">
      {/* 1. Hero Headline & Positioning */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Autonomous Website Intelligence & Commercial Strategy Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          Turn Any Website Into a <br className="hidden sm:inline" />
          <span className="text-gradient">High-Impact Client Strategy</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Comprehensive multi-page audit inspecting visitor conversion pathways, mobile visual hierarchy, local search visibility, and technical speed in 30 seconds.
        </p>
      </div>

      {/* 2. Main Audit Form Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Website URL Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-200">
                Website URL <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Desktop & Mobile Viewport Scan</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-base transition-all font-mono shadow-inner"
              />
            </div>
          </div>

          {/* Optional Business Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Business Name <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. AA Interior Design Studio"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900/80 border border-slate-700/70 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Target Location <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4 h-4 text-amber-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Coimbatore, Tamil Nadu"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900/80 border border-slate-700/70 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Advanced Crawl Settings */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Crawling Configuration' : 'Advanced Crawling Settings'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Crawl Depth Page Limit</span>
                  <span className="font-mono text-cyan-400 font-bold">{maxPages} pages</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Crawls key customer pathways including Homepage, About, Services, Products, Portfolio, Contact, and Case Studies.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl font-heading font-black text-base tracking-wide text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 active:scale-[0.99] transition-all duration-200 shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span>RUN FULL AUDIT</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Quick Demos & Presets */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <span className="font-bold">Test Presets & Industry Demos:</span>
            <span className="text-[11px] text-slate-500">Instant population</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('http://aainteriordesignstudio.com/', 'AA Interior Design Studio', 'Coimbatore, Tamil Nadu')}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition-colors border border-slate-700/70 hover:border-cyan-500/40 cursor-pointer"
            >
              AA Interior Design
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('https://www.mfg.com', 'MFG Marketplace', 'Global')}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition-colors border border-slate-700/70 hover:border-cyan-500/40 cursor-pointer"
            >
              Manufacturing (MFG.com)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('https://www.sweetgreen.com', 'Sweetgreen Hospitality', 'Los Angeles, CA')}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition-colors border border-slate-700/70 hover:border-cyan-500/40 cursor-pointer"
            >
              Restaurant (Sweetgreen)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('https://example.com', 'Example Co', 'Global')}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition-colors border border-slate-700/70 hover:border-cyan-500/40 cursor-pointer"
            >
              example.com (Baseline)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Supported 6-Pillar Audit Engine */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            6-Pillar Commercial & Technical Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Every audit generates grounded, evidence-backed findings across all key areas that impact visitor trust, Google rank, and sales conversion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: TrendingUp,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
              title: 'Conversion & Lead Capture',
              desc: 'Identifies missing WhatsApp triggers, click-to-call links, sticky enquiry forms, and friction in customer conversion funnels.',
            },
            {
              icon: Smartphone,
              color: 'text-sky-400',
              bg: 'bg-sky-500/10 border-sky-500/20',
              title: 'Visual Hierarchy & Mobile UX',
              desc: 'Dual-viewport inspection for typography contrast, touch-target spacing, above-the-fold CTA prominence, and mobile responsiveness.',
            },
            {
              icon: Gauge,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
              title: 'Core Web Vitals & Speed',
              desc: 'Measures First Contentful Paint (FCP), Largest Contentful Paint (LCP), and Cumulative Layout Shift (CLS) performance metrics.',
            },
            {
              icon: Compass,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'Local SEO & Search Visibility',
              desc: 'Evaluates geographical keyword placement, meta descriptions, semantic H1 headings, canonical tags, and structured schema.',
            },
            {
              icon: ShieldCheck,
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10 border-cyan-500/20',
              title: 'Defensive Security & Trust',
              desc: 'Validates SSL/TLS encryption, HSTS headers, defensive HTTP configurations, and runtime JavaScript error isolation.',
            },
            {
              icon: Layers,
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10 border-indigo-500/20',
              title: 'Dynamic Industry Blueprint',
              desc: 'Synthesizes custom 5-page sitemaps tailored to Interior Design, Manufacturing, Restaurants, Real Estate, and Gyms with phased roadmaps.',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl glass-panel glass-panel-hover border space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} border flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Three-Step SaaS Workflow */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Simple Autonomous Workflow</span>
          <h3 className="text-xl sm:text-2xl font-black text-white">How SHA Website Auditor Works</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Deep Multi-Page Crawl',
              desc: 'Automated browser crawls your pages, evaluates accessibility, captures desktop & mobile viewports, and records telemetry.',
            },
            {
              step: '02',
              title: 'Grounded Evidence Synthesis',
              desc: 'Multimodal AI and heuristic analyzers cross-examine every observation against atomic evidence IDs to eliminate false claims.',
            },
            {
              step: '03',
              title: 'Dual Executive & Technical Reports',
              desc: 'Generates non-technical Client Sales Dashboards alongside in-depth 20-category Technical Audits and branded PDF exports.',
            },
          ].map((item, idx) => (
            <div key={idx} className="space-y-2 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 font-mono">
                {item.step}
              </span>
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
