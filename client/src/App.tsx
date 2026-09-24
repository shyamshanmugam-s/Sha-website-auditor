import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { AuditForm } from './components/AuditForm.js';
import { AuditProgress } from './components/AuditProgress.js';
import { ExecutiveSummary } from './components/Dashboard/ExecutiveSummary.js';
import { CategoryTabs, ActiveTab } from './components/Dashboard/CategoryTabs.js';
import { FindingsSection } from './components/Dashboard/FindingsSection.js';
import { ScreenshotViewer } from './components/Dashboard/ScreenshotViewer.js';
import { PagesTable } from './components/Dashboard/PagesTable.js';
import { StrategicPlan } from './components/Dashboard/StrategicPlan.js';
import { ExportBar } from './components/Dashboard/ExportBar.js';
import { EvidenceModal } from './components/Dashboard/EvidenceModal.js';
import { SalesReportView } from './components/Dashboard/SalesReportView.js';
import { HistoryDrawer } from './components/HistoryDrawer.js';
import { API, CreateAuditParams, AuditStreamMessage } from './services/api.js';
import { ArrowLeft, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [salesReportData, setSalesReportData] = useState<any | null>(null);
  const [reportMode, setReportMode] = useState<'sales' | 'technical'>('sales');
  const [isAuditing, setIsAuditing] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamMessage, setStreamMessage] = useState('');
  const [streamStatus, setStreamStatus] = useState('');
  const [auditError, setAuditError] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  // History state
  const [historyAudits, setHistoryAudits] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load audit history on start
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const list = await API.listAudits();
      setHistoryAudits(list);
    } catch (err) {
      console.error('Failed to load audits history:', err);
    }
  };

  // Start new audit
  const handleStartAudit = async (params: CreateAuditParams) => {
    try {
      setIsAuditing(true);
      setAuditError(null);
      setStreamProgress(0);
      setStreamMessage('Starting audit...');
      setStreamStatus('queued');
      setTargetUrl(params.url);
      setAuditData(null);
      setSalesReportData(null);
      setReportMode('sales'); // Always default to Client Sales Audit upon new audit completion

      const res = await API.startAudit(params);
      setCurrentAuditId(res.auditId);

      // Polling fallback to guarantee report loads even if SSE drops
      const pollInterval = setInterval(async () => {
        try {
          const check = await API.getAudit(res.auditId);
          if (check && (check.status === 'completed' || check.status === 'failed')) {
            clearInterval(pollInterval);
            setIsAuditing(false);
            if (check.status === 'completed') {
              loadAuditReport(res.auditId);
              loadHistory();
            } else {
              setAuditError(check.error || 'Audit failed');
              loadHistory();
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 2000);

      // Subscribe to live SSE events
      API.subscribeToAuditStream(
        res.auditId,
        (msg: AuditStreamMessage) => {
          setStreamProgress(msg.progressPercent);
          setStreamMessage(msg.message);
          setStreamStatus(msg.status);

          if (msg.type === 'complete' || msg.status === 'completed') {
            clearInterval(pollInterval);
            setIsAuditing(false);
            loadAuditReport(res.auditId);
            loadHistory();
          } else if (msg.type === 'error' || msg.status === 'failed') {
            clearInterval(pollInterval);
            setIsAuditing(false);
            setAuditError(msg.message || 'Audit encountered an error');
            loadHistory();
          }
        },
        (err) => {
          console.warn('SSE stream notice:', err);
        }
      );
    } catch (err: any) {
      setIsAuditing(false);
      setAuditError(err.message || 'Failed to start audit job');
    }
  };

  const handleCancelAudit = async () => {
    if (currentAuditId) {
      await API.cancelAudit(currentAuditId);
      setIsAuditing(false);
      setStreamStatus('cancelled');
      setStreamMessage('Audit was cancelled by user.');
    }
  };

  const loadAuditReport = async (auditId: string) => {
    try {
      const data = await API.getAudit(auditId);
      setAuditData(data);
      setCurrentAuditId(auditId);
      setActiveTab('overview');
      setSelectedPriority(null);

      try {
        const sales = await API.getSalesReport(auditId);
        setSalesReportData(sales);
      } catch {
        // Fallback to data.salesReport
        setSalesReportData(data.salesReport || null);
      }
    } catch (err: any) {
      setAuditError(err.message || 'Could not load report');
    }
  };

  const handleSelectAudit = (id: string) => {
    setIsAuditing(false);
    setAuditError(null);
    loadAuditReport(id);
  };

  const handleNewAudit = () => {
    setAuditData(null);
    setCurrentAuditId(null);
    setIsAuditing(false);
    setAuditError(null);
  };

  const handleDeleteAudit = async (id: string) => {
    await API.deleteAudit(id);
    loadHistory();
    if (currentAuditId === id) {
      handleNewAudit();
    }
  };

  // Compute category findings count
  const findingsCountByCategory: Record<string, number> = {};
  if (auditData?.findings) {
    auditData.findings.forEach((f: any) => {
      findingsCountByCategory[f.category] = (findingsCountByCategory[f.category] || 0) + 1;
    });
  }

  // Filter findings for active tab
  const getTabFindings = () => {
    if (!auditData?.findings) return [];
    if (activeTab === 'overview') return auditData.findings;
    return auditData.findings.filter((f: any) => f.category === activeTab);
  };

  const homePage = auditData?.pages?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* SaaS Navigation Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewAudit={handleNewAudit}
        historyCount={historyAudits.length}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {!isAuditing && !auditData && (
          <AuditForm onSubmit={handleStartAudit} isLoading={isAuditing} />
        )}

        {isAuditing && (
          <AuditProgress
            progressPercent={streamProgress}
            message={streamMessage}
            status={streamStatus}
            url={targetUrl}
            onCancel={handleCancelAudit}
            error={auditError}
          />
        )}

        {!isAuditing && auditError && !auditData && (
          <div className="max-w-xl mx-auto p-8 rounded-3xl glass-panel-glow border border-rose-500/40 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-rose-300 font-extrabold text-xl">Audit Could Not Complete</div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">{auditError}</p>
            <div className="pt-2">
              <button
                onClick={handleNewAudit}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Try Another Website
              </button>
            </div>
          </div>
        )}

        {auditData && auditData.report && (
          <div className="space-y-6 animate-fadeIn">
            {/* Action Bar with New Audit Breadcrumb & Export Center */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleNewAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audit Another Website</span>
              </button>
            </div>

            {/* Top Export Bar */}
            <ExportBar auditId={auditData.id} audit={auditData} />

            {/* Dual Report View Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/90 shadow-xl">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setReportMode('sales')}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    reportMode === 'sales'
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span>💼 Client Sales Audit</span>
                  {reportMode === 'sales' && <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>}
                </button>
                <button
                  onClick={() => setReportMode('technical')}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    reportMode === 'technical'
                      ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span>⚙️ Full Technical Audit (20 Sections)</span>
                  {reportMode === 'technical' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </button>
              </div>

              <div className="text-xs text-slate-400 hidden lg:block font-medium">
                {reportMode === 'sales' ? '⚡ Non-technical strategy & growth blueprint for business owners' : '🔍 Deep technical telemetry, evidence tree & engineering findings'}
              </div>
            </div>

            {/* Render Active View */}
            {reportMode === 'sales' ? (
              <SalesReportView
                salesReport={salesReportData || auditData.salesReport}
                audit={auditData}
                onViewEvidence={setSelectedEvidenceId}
              />
            ) : (
              <>
                {/* Executive Summary */}
                <ExecutiveSummary
                  report={auditData.report}
                  audit={auditData}
                  onFilterPriority={setSelectedPriority}
                  selectedPriority={selectedPriority}
                />

                {/* Viewport Screenshots */}
                {(homePage?.desktopScreenshot || homePage?.mobileScreenshot) && (
                  <ScreenshotViewer
                    desktopScreenshot={homePage?.desktopScreenshot}
                    mobileScreenshot={homePage?.mobileScreenshot}
                    url={auditData.config.url}
                  />
                )}

                {/* Category Navigation Tabs */}
                <CategoryTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  findingsCountByCategory={findingsCountByCategory}
                />

                {/* Tab Specific Content */}
                {activeTab === 'pages' ? (
                  <PagesTable pages={auditData.pages || []} />
                ) : activeTab === 'strategy' ? (
                  <StrategicPlan report={auditData.report} />
                ) : (
                  <FindingsSection
                    findings={getTabFindings()}
                    selectedPriority={selectedPriority}
                    onSelectPriority={setSelectedPriority}
                    onViewEvidence={setSelectedEvidenceId}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* SaaS Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-slate-400 font-medium">
            SHA Website Auditor • Engineered by <span className="text-white font-bold">SHA WebStudio</span>
          </p>
          <p className="text-[11px] text-slate-600">
            Autonomous Multi-Viewport Web Intelligence • All audited data treated under strict privacy isolation.
          </p>
        </div>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        audits={historyAudits}
        onSelectAudit={handleSelectAudit}
        onDeleteAudit={handleDeleteAudit}
      />

      {/* Evidence Modal */}
      <EvidenceModal
        evidenceId={selectedEvidenceId}
        evidenceRegistry={auditData?.evidenceRegistry || []}
        onClose={() => setSelectedEvidenceId(null)}
      />
    </div>
  );
};
